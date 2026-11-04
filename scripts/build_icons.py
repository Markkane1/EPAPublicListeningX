import os
import base64
from io import BytesIO
from PIL import Image
import numpy as np

# Target Palette: Argon Theme #5e72e4 (Royal Iris Blue)
TARGET_MAIN = np.array([94, 114, 228], dtype=np.float32)   # #5e72e4 (Argon primary main)
TARGET_DARK = np.array([54, 72, 204], dtype=np.float32)    # #3648cc (shadow / deep iris fold)
TARGET_TEXT = np.array([30, 41, 59], dtype=np.float32)     # #1e293b (slate-800 typography)
WHITE = np.array([255, 255, 255], dtype=np.float32)

def recolor_mark(im_src):
    """
    Recolors the EPA mark:
    - Main leaf blade + 'EPA' letters -> TARGET_MAIN (#5e72e4)
    - Lower curved fold / shadow -> TARGET_DARK (#3648cc)
    - Anti-aliased edges and background made transparent
    """
    arr = np.array(im_src.convert('RGBA'), dtype=np.float32)
    rows, cols = arr.shape[:2]
    
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    orig_a = arr[:, :, 3]
    
    min_rgb = np.minimum(r, np.minimum(g, b))
    
    # Weight between main and dark fold based on (R - B)
    # Centroid 1 (main): R - B ~ +20
    # Centroid 2 (dark): R - B ~ -35
    diff = r - b
    w = np.clip((diff - (-30.0)) / (20.0 - (-30.0)), 0.0, 1.0)
    
    fg_color = np.zeros((rows, cols, 3), dtype=np.float32)
    for i in range(3):
        fg_color[:, :, i] = TARGET_DARK[i] + w * (TARGET_MAIN[i] - TARGET_DARK[i])
        
    # Alpha calculation from white background
    alpha = np.clip((252.0 - min_rgb) / (252.0 - 45.0), 0.0, 1.0)
    alpha = alpha * alpha * (3.0 - 2.0 * alpha) # smoothstep
    alpha = alpha * (orig_a / 255.0)
    
    out = np.zeros((rows, cols, 4), dtype=np.uint8)
    out[:, :, :3] = np.clip(fg_color, 0, 255).astype(np.uint8)
    out[:, :, 3] = np.clip(alpha * 255.0, 0, 255).astype(np.uint8)
    return Image.fromarray(out, mode='RGBA')

def recolor_full(im_src):
    """
    Recolors the full EPA Punjab Social Listening logo:
    - Top emblem + 'EPA' letters -> TARGET_MAIN & TARGET_DARK
    - 'Social Listening' and 'Punjab' typography -> TARGET_TEXT (#1e293b)
    - Horizontal accent lines -> TARGET_MAIN (#5e72e4)
    - Anti-aliased edges and background made transparent
    """
    arr = np.array(im_src.convert('RGBA'), dtype=np.float32)
    rows, cols = arr.shape[:2]
    
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    orig_a = arr[:, :, 3]
    min_rgb = np.minimum(r, np.minimum(g, b))
    
    # Typography mask: lower section (y >= 420), dark text (G < 95 and min_rgb < 60)
    is_text = np.zeros((rows, cols), dtype=bool)
    is_text[420:, :] = (g[420:, :] < 95) & (min_rgb[420:, :] < 60)
    
    # Colored pixels: blend between TARGET_DARK and TARGET_MAIN
    diff = r - b
    w = np.clip((diff - (-30.0)) / (20.0 - (-30.0)), 0.0, 1.0)
    fg_color = np.zeros((rows, cols, 3), dtype=np.float32)
    for i in range(3):
        fg_color[:, :, i] = TARGET_DARK[i] + w * (TARGET_MAIN[i] - TARGET_DARK[i])
        
    for i in range(3):
        fg_color[is_text, i] = TARGET_TEXT[i]
        
    denom = np.where(is_text, 252.0 - 5.0, 252.0 - 45.0)
    alpha = np.clip((252.0 - min_rgb) / denom, 0.0, 1.0)
    alpha = alpha * alpha * (3.0 - 2.0 * alpha) # smoothstep
    alpha = alpha * (orig_a / 255.0)
    
    out = np.zeros((rows, cols, 4), dtype=np.uint8)
    out[:, :, :3] = np.clip(fg_color, 0, 255).astype(np.uint8)
    out[:, :, 3] = np.clip(alpha * 255.0, 0, 255).astype(np.uint8)
    return Image.fromarray(out, mode='RGBA')

def main():
    img1_path = r'C:/Users/Asif/.gemini/antigravity/brain/997dcc8d-2f23-41ea-9f05-fdb09db78673/.user_uploaded/media_1793712794595_c1950e79.jpg'
    img2_path = r'C:/Users/Asif/.gemini/antigravity/brain/997dcc8d-2f23-41ea-9f05-fdb09db78673/.user_uploaded/media_1793712803368_2975bafd.png'
    
    if not os.path.exists(img1_path) or not os.path.exists(img2_path):
        # Fallback to existing public logos if original uploads moved
        print('Source media uploads not found, loading from existing logo files...')
        im1_base = Image.open('dashboard/public/logo-epa-mark.png')
        im2_base = Image.open('dashboard/public/logo-epa-full.png')
        crop1 = im1_base
        crop2 = im2_base
    else:
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

    # Recolor both
    print('Recoloring mark to match Argon UI #5e72e4...')
    recolored_mark = recolor_mark(crop1)
    print('Recoloring full logo to match Argon UI #5e72e4 and typography #1e293b...')
    recolored_full = recolor_full(crop2)
    
    targets = {
        'dashboard/public/favicon.png': (recolored_mark, (32, 32)),
        'dashboard/public/apple-icon.png': (recolored_mark, (180, 180)),
        'dashboard/public/logo192.png': (recolored_mark, (192, 192)),
        'dashboard/public/logo512.png': (recolored_mark, (512, 512)),
        'dashboard/public/logo-epa-mark.png': (recolored_mark, (512, 512)),
        'dashboard/public/logo-epa-full.png': (recolored_full, (recolored_full.width, recolored_full.height)),
        
        'dashboard/src/assets/images/favicon.png': (recolored_mark, (32, 32)),
        'dashboard/src/assets/images/apple-icon.png': (recolored_mark, (180, 180)),
        'dashboard/src/assets/images/logo-ct.png': (recolored_mark, (256, 256)),
        'dashboard/src/assets/images/logo-ct-dark.png': (recolored_mark, (256, 256)),
        'dashboard/src/assets/images/logo-epa-mark.png': (recolored_mark, (512, 512)),
        'dashboard/src/assets/images/logo-epa-full.png': (recolored_full, (recolored_full.width, recolored_full.height)),
        
        'favicon.png': (recolored_mark, (32, 32)),
        'apple-icon.png': (recolored_mark, (180, 180)),
        'logo-epa-mark.png': (recolored_mark, (512, 512)),
        'logo-epa-full.png': (recolored_full, (recolored_full.width, recolored_full.height)),
        
        'portal/favicon.png': (recolored_mark, (32, 32)),
        'portal/apple-icon.png': (recolored_mark, (180, 180)),
        'portal/logo-epa-mark.png': (recolored_mark, (512, 512)),
        'portal/logo-epa-full.png': (recolored_full, (recolored_full.width, recolored_full.height)),
        
        'scrapper/icons/icon16.png': (recolored_mark, (16, 16)),
        'scrapper/icons/icon48.png': (recolored_mark, (48, 48)),
        'scrapper/icons/icon128.png': (recolored_mark, (128, 128)),
        'scrapper/icons/epa_logo.png': (recolored_full, (recolored_full.width, recolored_full.height)),
        
        'scrapper/release/extension/icons/icon16.png': (recolored_mark, (16, 16)),
        'scrapper/release/extension/icons/icon48.png': (recolored_mark, (48, 48)),
        'scrapper/release/extension/icons/icon128.png': (recolored_mark, (128, 128)),
        'scrapper/release/extension/icons/epa_logo.png': (recolored_full, (recolored_full.width, recolored_full.height)),
    }
    
    for rel_path, (src_img, size) in targets.items():
        d = os.path.dirname(rel_path)
        if d:
            os.makedirs(d, exist_ok=True)
        resized = src_img.resize(size, Image.Resampling.LANCZOS)
        resized.save(rel_path)
        
    # Generate ICO files
    ico_sizes = [(16, 16), (32, 32), (48, 48)]
    for ico_path in ['dashboard/public/favicon.ico', 'favicon.ico', 'portal/favicon.ico']:
        d = os.path.dirname(ico_path)
        if d:
            os.makedirs(d, exist_ok=True)
        recolored_mark.save(ico_path, format='ICO', sizes=ico_sizes)
        
    # Generate clean SVG with base64 recolored PNG
    buf = recolored_mark.resize((128, 128), Image.Resampling.LANCZOS)
    bio = BytesIO()
    buf.save(bio, format='PNG')
    b64_png = base64.b64encode(bio.getvalue()).decode('ascii')
    
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <rect width="128" height="128" rx="24" fill="#ffffff"/>
  <image href="data:image/png;base64,{b64_png}" width="128" height="128"/>
</svg>'''
    
    for svg_path in ['dashboard/public/favicon.svg', 'portal/favicon.svg']:
        d = os.path.dirname(svg_path)
        if d:
            os.makedirs(d, exist_ok=True)
        with open(svg_path, 'w', encoding='utf-8') as f:
            f.write(svg_content)
            
    print('All logos, icons, and favicons successfully built with matching UI palette #5e72e4!')

if __name__ == '__main__':
    main()
