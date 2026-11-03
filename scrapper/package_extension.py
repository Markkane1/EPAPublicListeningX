import os
import sys
import json
import shutil
import subprocess
import zipfile

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SCRAPPER_DIR = SCRIPT_DIR
RELEASE_DIR = os.path.join(SCRAPPER_DIR, "release")
STAGE_DIR = os.path.join(RELEASE_DIR, "extension")
MANIFEST_PATH = os.path.join(SCRAPPER_DIR, "manifest.json")

CHROME_PATHS = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
    r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
]

def find_browser():
    for p in CHROME_PATHS:
        if os.path.exists(p):
            return p
    return None

def build():
    print("=" * 60)
    print("  EPA X Scrapper — Extension Packaging Engine")
    print("=" * 60)

    if not os.path.exists(MANIFEST_PATH):
        print(f"Error: manifest.json not found at {MANIFEST_PATH}")
        sys.exit(1)

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    version = manifest.get("version", "1.0.0")
    name = manifest.get("name", "EPA X Scrapper")
    print(f"📦 Packaging '{name}' v{version}...")

    os.makedirs(STAGE_DIR, exist_ok=True)

    core_files = [
        "manifest.json",
        "background.js",
        "content.js",
        "injected.js",
        "parser.js",
        "exporter.js",
        "overlay.css",
        "popup.html",
        "popup.js",
        "popup.css",
    ]

    for fname in core_files:
        src = os.path.join(SCRAPPER_DIR, fname)
        dst = os.path.join(STAGE_DIR, fname)
        if os.path.exists(src):
            shutil.copy2(src, dst)
        else:
            print(f"Warning: {fname} missing from source.")

    icons_src = os.path.join(SCRAPPER_DIR, "icons")
    icons_dst = os.path.join(STAGE_DIR, "icons")
    if os.path.exists(icons_dst):
        shutil.rmtree(icons_dst)
    shutil.copytree(icons_src, icons_dst)

    zip_filename = f"epa-x-scrapper-v{version}.zip"
    zip_path = os.path.join(RELEASE_DIR, zip_filename)
    print(f"\n[1/2] Creating ZIP archive: {zip_filename}...")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(STAGE_DIR):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, STAGE_DIR)
                zipf.write(full_path, rel_path)
    zip_size_kb = os.path.getsize(zip_path) / 1024
    print(f"  ✓ Created {zip_path} ({zip_size_kb:.1f} KB)")

    browser_exe = find_browser()
    crx_filename = f"epa-x-scrapper-v{version}.crx"
    pem_filename = f"epa-x-scrapper-v{version}.pem"
    crx_path = os.path.join(RELEASE_DIR, crx_filename)
    pem_path = os.path.join(RELEASE_DIR, pem_filename)

    if browser_exe:
        print(f"\n[2/2] Packing Chromium CRX extension using {os.path.basename(browser_exe)}...")
        cmd = [browser_exe, f"--pack-extension={STAGE_DIR}", "--no-message-box"]
        if os.path.exists(pem_path):
            cmd.append(f"--pack-extension-key={pem_path}")

        try:
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            raw_crx = os.path.join(RELEASE_DIR, "extension.crx")
            raw_pem = os.path.join(RELEASE_DIR, "extension.pem")
            if os.path.exists(raw_crx):
                shutil.move(raw_crx, crx_path)
            if os.path.exists(raw_pem):
                shutil.move(raw_pem, pem_path)

            if os.path.exists(crx_path):
                crx_size_kb = os.path.getsize(crx_path) / 1024
                print(f"  ✓ Created {crx_path} ({crx_size_kb:.1f} KB)")
                print(f"  ✓ Signing Key preserved at {pem_path}")
        except Exception as e:
            print(f"  Note: Chromium packed CRX build failed or timed out: {e}")
    else:
        print("\n[2/2] Chrome not found on PATH; skipped .crx packing (ZIP archive is fully ready).")

    print("\n" + "=" * 60)
    print("  ✅ All Distributable Packages Ready in:")
    print(f"     {RELEASE_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    build()
