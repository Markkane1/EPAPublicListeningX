import os
import base64
from PIL import Image

img1_path = r'C:/Users/Asif/.gemini/antigravity/brain/997dcc8d-2f23-41ea-9f05-fdb09db78673/.user_uploaded/media_1793712794595_c1950e79.jpg'
img2_path = r'C:/Users/Asif/.gemini/antigravity/brain/997dcc8d-2f23-41ea-9f05-fdb09db78673/.user_uploaded/media_1793712803368_2975bafd.png'

im1 = Image.open(img1_path).convert('RGBA')
im2 = Image.open(img2_path).convert('RGBA')

bbox1 = (16, 29, 1006, 1011)
w1 = bbox1[2] - bbox1[0]
h1 = bbox1[3] - bbox1[1]
size1 = max(w1, h1)
pad1 = int(size1 * 0.05)
cx1 = (bbox1[0] + bbox1[2]) // 2
cy1 = (bbox1[1] + bbox1[3]) // 2
half1 = size1 // 2 + pad1
crop1 = im1.crop((cx1 - half1, cy1 - half1, cx1 + half1, cy1 + half1))

bbox2 = (189, 64, 833, 624)
w2 = bbox2[2] - bbox2[0]
h2 = bbox2[3] - bbox2[1]
pad2_x = int(w2 * 0.04)
pad2_y = int(h2 * 0.04)
crop2 = im2.crop((bbox2[0] - pad2_x, bbox2[1] - pad2_y, bbox2[2] + pad2_x, bbox2[3] + pad2_y))

targets = {
    'dashboard/public/favicon.png': (crop1, (32, 32)),
    'dashboard/public/apple-icon.png': (crop1, (180, 180)),
    'dashboard/public/logo192.png': (crop1, (192, 192)),
    'dashboard/public/logo512.png': (crop1, (512, 512)),
    'dashboard/public/logo-epa-mark.png': (crop1, (512, 512)),
    'dashboard/public/logo-epa-full.png': (crop2, (crop2.width, crop2.height)),
    
    'dashboard/src/assets/images/favicon.png': (crop1, (32, 32)),
    'dashboard/src/assets/images/apple-icon.png': (crop1, (180, 180)),
    'dashboard/src/assets/images/logo-ct.png': (crop1, (256, 256)),
    'dashboard/src/assets/images/logo-ct-dark.png': (crop1, (256, 256)),
    'dashboard/src/assets/images/logo-epa-mark.png': (crop1, (512, 512)),
    'dashboard/src/assets/images/logo-epa-full.png': (crop2, (crop2.width, crop2.height)),
    
    'favicon.png': (crop1, (32, 32)),
    'apple-icon.png': (crop1, (180, 180)),
    'logo-epa-mark.png': (crop1, (512, 512)),
    'logo-epa-full.png': (crop2, (crop2.width, crop2.height)),
    
    'portal/favicon.png': (crop1, (32, 32)),
    'portal/apple-icon.png': (crop1, (180, 180)),
    'portal/logo-epa-mark.png': (crop1, (512, 512)),
    'portal/logo-epa-full.png': (crop2, (crop2.width, crop2.height)),
    
    'scrapper/icons/icon16.png': (crop1, (16, 16)),
    'scrapper/icons/icon48.png': (crop1, (48, 48)),
    'scrapper/icons/icon128.png': (crop1, (128, 128)),
    'scrapper/icons/epa_logo.png': (crop2, (crop2.width, crop2.height)),
    
    'scrapper/release/extension/icons/icon16.png': (crop1, (16, 16)),
    'scrapper/release/extension/icons/icon48.png': (crop1, (48, 48)),
    'scrapper/release/extension/icons/icon128.png': (crop1, (128, 128)),
    'scrapper/release/extension/icons/epa_logo.png': (crop2, (crop2.width, crop2.height)),
}

for rel_path, (src_img, size) in targets.items():
    d = os.path.dirname(rel_path)
    if d:
        os.makedirs(d, exist_ok=True)
    resized = src_img.resize(size, Image.Resampling.LANCZOS)
    resized.save(rel_path)

ico_sizes = [(16, 16), (32, 32), (48, 48)]
for ico_path in ['dashboard/public/favicon.ico', 'favicon.ico', 'portal/favicon.ico']:
    d = os.path.dirname(ico_path)
    if d:
        os.makedirs(d, exist_ok=True)
    crop1.save(ico_path, format='ICO', sizes=ico_sizes)

from io import BytesIO
buf = crop1.resize((128, 128), Image.Resampling.LANCZOS)
bio = BytesIO()
buf.save(bio, format='PNG')
b64_png = base64.b64encode(bio.getvalue()).decode('ascii')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <rect width="128" height="128" rx="24" fill="#ffffff"/>
  <image href="data:image/png;base64,{b64_png}" width="128" height="128"/>
</svg>'''

with open('dashboard/public/favicon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

print('Successfully generated all icons, favicons, and logos!')
