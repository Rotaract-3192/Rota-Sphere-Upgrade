import os
from PIL import Image

source_path = r"C:\Users\pabt2\.gemini\antigravity-ide\brain\6225bf4e-e428-4f5a-aa08-0174ff6812c6\.user_uploaded\media_1786876460249.png"
public_dir = r"c:\Users\pabt2\.gemini\antigravity-ide\scratch\Rota-Sphere\public"
app_dir = r"c:\Users\pabt2\.gemini\antigravity-ide\scratch\Rota-Sphere\src\app"

os.makedirs(public_dir, exist_ok=True)
os.makedirs(app_dir, exist_ok=True)

img = Image.open(source_path).convert("RGBA")

# 1. multi-resolution favicon.ico (16x16, 32x32, 48x48)
ico_sizes = [(16, 16), (32, 32), (48, 48)]
img.save(os.path.join(public_dir, "favicon.ico"), format="ICO", sizes=ico_sizes)
img.save(os.path.join(app_dir, "favicon.ico"), format="ICO", sizes=ico_sizes)
print("Saved favicon.ico")

# 2. favicon-96x96.png
img_96 = img.resize((96, 96), Image.Resampling.LANCZOS)
img_96.save(os.path.join(public_dir, "favicon-96x96.png"), format="PNG")
print("Saved favicon-96x96.png")

# 3. apple-touch-icon.png (180x180)
img_180 = img.resize((180, 180), Image.Resampling.LANCZOS)
img_180.save(os.path.join(public_dir, "apple-touch-icon.png"), format="PNG")
img_180.save(os.path.join(app_dir, "apple-icon.png"), format="PNG")
print("Saved apple-touch-icon.png & apple-icon.png")

# 4. web-app-manifest-192x192.png
img_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
img_192.save(os.path.join(public_dir, "web-app-manifest-192x192.png"), format="PNG")
print("Saved web-app-manifest-192x192.png")

# 5. web-app-manifest-512x512.png & icon.png
img_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
img_512.save(os.path.join(public_dir, "web-app-manifest-512x512.png"), format="PNG")
img_512.save(os.path.join(public_dir, "icon.png"), format="PNG")
img_512.save(os.path.join(public_dir, "favicon.png"), format="PNG")
img_512.save(os.path.join(app_dir, "icon.png"), format="PNG")
print("Saved 512x512 icons in public and app directories")
