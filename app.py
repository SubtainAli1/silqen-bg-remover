import gc, html, io, json, os, secrets, sys, threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse
from urllib.request import urlopen

from PIL import Image

if sys.stdout is None:
    sys.stdout = open(os.devnull, "w")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w")

import webview  # apni alag window (Edge ki zaroorat nahi)

# ================== NAAM YAHAN BADLEIN ==================
APP_NAME = "Silqen Bg Remover"      # app ka naam: window, title bar, top bar sab jagah yahi aayega
CREATED_BY = "SubtainAi"    # "Created by" Silqen Studio
# ========================================================

BASE = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(BASE, "web")
BUNDLED = os.path.join(BASE, "models")                      # installer ke sath aane wale models
HOME_DIR = os.path.join(os.path.expanduser("~"), ".u2net")  # rembg ki apni jagah
USER_DIR = os.path.join(os.environ.get("LOCALAPPDATA", os.path.expanduser("~")),
                        APP_NAME, "models")                 # baad mein download hone wale models

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
window = None        # app ki window (neeche main mein banti hai)
pending_saves = {}   # Save dialog mein chuni gayi jagah, ek dafa istemal hone wale token ke sath
last_dir = ""        # pichli dafa jis folder mein save kiya


def find_model(name):
    for folder in (BUNDLED, USER_DIR, HOME_DIR):
        if os.path.exists(os.path.join(folder, name + ".onnx")):
            return folder
    return None


def model_list():
    return [[name, label, find_model(name) is not None] for name, label in MODELS]


def get_session(name):
    # Hamesha lock ke andar bulayein. Model na ho to rembg use USER_DIR mein download karta hai.
    if name not in sessions:
        # RAM bachane ke liye ek waqt mein sirf ek model: naya model lene se pehle purana nikaal do
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
    """Ye functions editor.js se window.pywebview.api.<naam>() ke zariye chalte hain."""

    def choose_save(self, filename):
        # Windows ka "Save As" dialog kholta hai. Cancel par None.
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
            # App dobara kholi gayi: nayi window ke bajaye pehli wali ko samne le aao
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
            # Sirf wahi jagah jo user ne Save dialog mein khud chuni ho
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
                    sessions.clear()   # adhoora model RAM se nikaal do
                msg = "Not enough memory for this model. Please use Balanced or Fast."
            self.reply(500, "text/plain; charset=utf-8", msg.encode())
        finally:
            gc.collect()   # kaam ke baad bachi hui RAM wapas do


def warmup():
    # App khulte hi maujood model load kar lo (download kabhi nahi karta)
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
        # App pehle se khuli hai: usi ki window samne le aao aur yeh copy band kar do
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
    os._exit(0)  # window band = app poori tarah band (Task Manager ki zaroorat nahi)
