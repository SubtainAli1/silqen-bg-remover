import gc, html, io, json, os, secrets, sys, threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse
from urllib.request import urlopen

from PIL import Image

if sys.stdout is None:
    sys.stdout = open(os.devnull, "w")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w")

import webview  # native app window (no browser needed)

# ================== APP SETTINGS =======================
APP_NAME = "SILQEN BG REMOVER"    # shown in the window title, top bar and file names
CREATED_BY = "SubtainAi"    # shown in "Created by Silqen Studio"
# ========================================================

BASE = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(BASE, "web")
BUNDLED = os.path.join(BASE, "models")                      # models shipped with the installer
HOME_DIR = os.path.join(os.path.expanduser("~"), ".u2net")  # rembg's default model folder
USER_DIR = os.path.join(os.environ.get("LOCALAPPDATA", os.path.expanduser("~")),
                        APP_NAME, "models")                 # models downloaded later

PORT = 8765
URL = f"http://127.0.0.1:{PORT}/"
MODELS = [["u2netp", "Fast"], ["isnet-general-use", "Balanced"], ["birefnet-general", "Best"]]
FILES = {
    "/": ("index.html", "text/html; charset=utf-8"),
    "/style.css": ("style.css", "text/css; charset=utf-8"),
    "/editor.js": ("editor.js", "text/javascript; charset=utf-8"),
    "/logo.png": ("logo.png", "image/png"),
}
sessions = {}
lock = threading.Lock()
window = None        # app window (created in __main__)
pending_saves = {}   # save paths chosen in the Save dialog, keyed by one-time token
last_dir = ""        # last folder used for saving


def find_model(name):
    for folder in (BUNDLED, USER_DIR, HOME_DIR):
        if os.path.exists(os.path.join(folder, name + ".onnx")):
            return folder
    return None


def model_list():
    return [[name, label, find_model(name) is not None] for name, label in MODELS]


def get_session(name):
    # Always call while holding `lock`. If the model is missing, rembg downloads it to USER_DIR.
    if name not in sessions:
        # Keep only one model in memory: unload the previous one before loading a new one
        sessions.clear()
        gc.collect()
        folder = find_model(name)
        if folder is None:
            os.makedirs(USER_DIR, exist_ok=True)
            folder = USER_DIR
        os.environ["U2NET_HOME"] = folder
        from rembg import new_session
        sessions[name] = new_session(name)
    return sessions[name]


class Api:
    """Methods callable from editor.js as window.pywebview.api.<name>()."""

    def choose_save(self, filename):
        # Opens the Windows "Save As" dialog. Returns None if cancelled.
        global last_dir
        ext = os.path.splitext(filename)[1].lstrip(".").lower() or "png"
        result = window.create_file_dialog(
            webview.SAVE_DIALOG, directory=last_dir, save_filename=filename,
            file_types=(f"{ext.upper()} image (*.{ext})", "All files (*.*)"))
        if isinstance(result, (list, tuple)):
            result = result[0] if result else None
        if not result:
            return None
        last_dir = os.path.dirname(result)
        token = secrets.token_urlsafe(16)
        pending_saves[token] = result
        return token


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def reply(self, code, ctype, body):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/ping":
            self.reply(200, "text/plain", b"ok")
        elif path == "/focus":
            # The app was launched again: bring the existing window to the front
            try:
                window.restore()
                window.on_top = True
                window.on_top = False
            except Exception:
                pass
            self.reply(200, "text/plain", b"ok")
        elif path == "/models":
            self.reply(200, "application/json", json.dumps(model_list()).encode())
        elif path in FILES:
            name, ctype = FILES[path]
            full = os.path.join(WEB, name)
            if not os.path.exists(full):
                return self.reply(404, "text/plain", b"Not found")
            with open(full, "rb") as f:
                body = f.read()
            if name == "index.html":
                text = body.decode("utf-8")
                text = text.replace("{{APP_NAME}}", html.escape(APP_NAME))
                text = text.replace("{{CREATED_BY}}", html.escape(CREATED_BY))
                body = text.encode("utf-8")
            self.reply(200, ctype, body)
        else:
            self.reply(404, "text/plain", b"Not found")

    def do_POST(self):
        url = urlparse(self.path)
        query = parse_qs(url.query)
        if url.path == "/save":
            # Only write to a path the user picked in the Save dialog
            target = pending_saves.pop(query.get("token", [""])[0], None)
            if not target:
                return self.reply(403, "text/plain", b"Save location not chosen")
            try:
                data = self.rfile.read(int(self.headers.get("Content-Length", 0)))
                with open(target, "wb") as f:
                    f.write(data)
                return self.reply(200, "text/plain; charset=utf-8", os.path.basename(target).encode())
            except Exception as e:
                return self.reply(500, "text/plain; charset=utf-8", str(e).encode())
        if url.path != "/remove":
            return self.reply(404, "text/plain", b"Not found")
        model = query.get("model", ["isnet-general-use"])[0]
        if model not in [m[0] for m in MODELS]:
            return self.reply(400, "text/plain", b"Unknown model")
        try:
            data = self.rfile.read(int(self.headers.get("Content-Length", 0)))
            with lock:
                session = get_session(model)
                from rembg import remove
                img = Image.open(io.BytesIO(data)).convert("RGB")
                mask = remove(img, session=session, only_mask=True)
            del data, img
            out = Image.new("L", mask.size, 255)
            out.putalpha(mask.convert("L"))
            buf = io.BytesIO()
            out.save(buf, "PNG", compress_level=1)
            del mask, out
            self.reply(200, "image/png", buf.getvalue())
        except Exception as e:
            msg = str(e)
            if isinstance(e, MemoryError) or "alloc" in msg.lower():
                with lock:
                    sessions.clear()   # unload the partly loaded model
                msg = "Not enough memory for this model. Please use Balanced or Fast."
            self.reply(500, "text/plain; charset=utf-8", msg.encode())
        finally:
            gc.collect()   # release memory after each request


def warmup():
    # Preload an installed model at startup (never downloads)
    try:
        installed = [m[0] for m in model_list() if m[2]]
        if not installed:
            return
        name = "isnet-general-use" if "isnet-general-use" in installed else installed[0]
        with lock:
            get_session(name)
    except Exception:
        pass


if __name__ == "__main__":
    try:
        server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    except OSError:
        # Already running: focus the existing window and exit this copy
        try:
            urlopen(URL + "focus", timeout=3)
        except Exception:
            pass
        sys.exit()
    threading.Thread(target=server.serve_forever, daemon=True).start()
    threading.Thread(target=warmup, daemon=True).start()
    window = webview.create_window(APP_NAME, URL, js_api=Api(), width=1400, height=900,
                                   min_size=(900, 600), background_color="#17191D")
    webview.start()
    os._exit(0)  # closing the window fully exits the app
