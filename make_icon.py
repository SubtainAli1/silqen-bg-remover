# web\logo.png se icon.ico banata hai (EXE, installer aur taskbar ke liye)
# Chalana:  py -3.13 make_icon.py
from PIL import Image

img = Image.open("web/logo.png").convert("RGBA")
side = max(img.size)
square = Image.new("RGBA", (side, side), (0, 0, 0, 0))   # logo ko beech mein rakh kar square banao
square.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
square.save("icon.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print("icon.ico ban gaya")
