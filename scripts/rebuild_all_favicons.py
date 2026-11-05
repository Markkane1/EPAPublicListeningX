import base64
import os
import shutil
from PIL import Image

def generate_icons():
    src_mark = 'dashboard/public/logo-epa-mark.png'
    if not os.path.exists(src_mark):
        src_mark = 'logo-epa-mark.png'
    
    print(f"Loading source mark from {src_mark}...")
    im = Image.open(src_mark).convert('RGBA')

    # Generate 16x16, 32x32, 48x48, 64x64, 180x180
    im16 = im.resize((16, 16), Image.Resampling.LANCZOS)
    im32 = im.resize((32, 32), Image.Resampling.LANCZOS)
    im48 = im.resize((48, 48), Image.Resampling.LANCZOS)
    im64 = im.resize((64, 64), Image.Resampling.LANCZOS)
    im180 = im.resize((180, 180), Image.Resampling.LANCZOS)

    # Base64 string for SVG
    import io
    buf = io.BytesIO()
    im.resize((128, 128), Image.Resampling.LANCZOS).save(buf, format='PNG')
    b64_str = base64.b64encode(buf.getvalue()).decode('ascii')

    # Crisp SVG favicon
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#5e72e4"/>
      <stop offset="100%" stop-color="#825ee4"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="26" fill="url(#bgGrad)"/>
  <g transform="translate(14, 14) scale(0.78125)">
    <image href="data:image/png;base64,{b64_str}" width="128" height="128"/>
  </g>
</svg>
'''

    # Save to dashboard/public
    pub_dir = 'dashboard/public'
    im.save(os.path.join(pub_dir, 'favicon.ico'), format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    im32.save(os.path.join(pub_dir, 'favicon.png'), format='PNG')
    im32.save(os.path.join(pub_dir, 'favicon-32x32.png'), format='PNG')
    im16.save(os.path.join(pub_dir, 'favicon-16x16.png'), format='PNG')
    im180.save(os.path.join(pub_dir, 'apple-icon.png'), format='PNG')
    with open(os.path.join(pub_dir, 'favicon.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_content)

    print("Saved public icons.")

    # Target directories to replicate
    targets = [
        'dashboard/src/assets/images',
        'dashboard/dist',
        'portal',
        '.'
    ]

    for t in targets:
        os.makedirs(t, exist_ok=True)
        shutil.copy2(os.path.join(pub_dir, 'favicon.ico'), os.path.join(t, 'favicon.ico'))
        shutil.copy2(os.path.join(pub_dir, 'favicon.png'), os.path.join(t, 'favicon.png'))
        if os.path.exists(os.path.join(t, 'favicon-32x32.png')) or t in ['dashboard/dist', 'portal']:
            shutil.copy2(os.path.join(pub_dir, 'favicon-32x32.png'), os.path.join(t, 'favicon-32x32.png'))
        if os.path.exists(os.path.join(t, 'favicon-16x16.png')) or t in ['dashboard/dist', 'portal']:
            shutil.copy2(os.path.join(pub_dir, 'favicon-16x16.png'), os.path.join(t, 'favicon-16x16.png'))
        shutil.copy2(os.path.join(pub_dir, 'favicon.svg'), os.path.join(t, 'favicon.svg'))
        shutil.copy2(os.path.join(pub_dir, 'apple-icon.png'), os.path.join(t, 'apple-icon.png'))
        print(f"Synchronized to {t}")

    print("All favicons rebuilt successfully with Royal Blue palette!")

if __name__ == '__main__':
    generate_icons()
