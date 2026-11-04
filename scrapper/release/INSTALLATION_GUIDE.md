# 𝕏 EPA Punjab Social Listening — Distribution & Installation Guide

This guide explains how to share and install the **EPA Punjab Social Listening** Chrome extension on any computer running **Google Chrome**, **Brave Browser**, **Microsoft Edge**, **Opera**, or **Vivaldi**.

---

## 📦 What's Inside the Release Package

| File | Purpose | Best Used For |
| :--- | :--- | :--- |
| **`epa-x-scrapper-v1.0.0.zip`** | Portable zipped extension bundle | **Sharing via Email, Slack, Teams, Google Drive** |
| **`epa-x-scrapper-v1.0.0.crx`** | Signed Chromium packed extension | Direct drag-and-drop installation |
| **`extension/`** | Pre-extracted extension directory | Immediate local "Load unpacked" install |
| **`quick_install.bat`** | Windows 1-click helper script | Automatically opens `chrome://extensions` and the folder |

---

## 🚀 How to Share With Other People

Simply send the recipient either:
1. **`epa-x-scrapper-v1.0.0.zip`** (Recommended — works 100% reliably on all machines, even with strict corporate policies), OR
2. **`epa-x-scrapper-v1.0.0.crx`** (For quick drag-and-drop install).

---

## 🛠️ Step-by-Step Installation Instructions

### Method 1: The ZIP Method (Recommended — Works on All Browsers)

> This method works reliably on Chrome, Brave, Edge, Opera, and Vivaldi without any store restrictions.

1. **Unzip the File**:
   - Right-click `epa-x-scrapper-v1.0.0.zip` and select **Extract All...** (or extract to a folder of your choice, e.g. `epa-x-scrapper`).
2. **Open Extensions in Your Browser**:
   - In **Google Chrome**: go to `chrome://extensions`
   - In **Brave**: go to `brave://extensions`
   - In **Microsoft Edge**: go to `edge://extensions`
3. **Turn ON "Developer mode"**:
   - Look in the **top-right corner** of the Extensions page and toggle the **Developer mode** switch to **ON**.
4. **Load the Extension**:
   - Click the **"Load unpacked"** button in the top-left corner.
   - Select the extracted `epa-x-scrapper` folder (the folder containing `manifest.json`).
5. **Done!** The extension **"EPA Punjab Social Listening"** is now installed and active.

---

### Method 2: The CRX Drag & Drop Method (Quickest)

1. Open your browser and navigate to `chrome://extensions` (or `brave://extensions` / `edge://extensions`).
2. Toggle **Developer mode** in the top-right corner to **ON**.
3. Drag the **`epa-x-scrapper-v1.0.0.crx`** file from your file manager and drop it directly onto the Extensions browser tab.
4. When prompted by the browser, click **"Add extension"**.

---

## 📌 Pinning & Using the Extension

1. **Pin to Toolbar**:
   - Click the puzzle-piece icon (**Extensions**) in the browser's top-right toolbar.
   - Find **EPA Punjab Social Listening** and click the **Pin** icon so its logo is always visible.
2. **Go to X.com**:
   - Navigate to [https://x.com](https://x.com) in your browser.
3. **Scraper Floating HUD**:
   - A floating pill titled **`[ 𝕏 Scraper ]`** will appear in the bottom-right corner of the page.
   - Click it to expand the control panel.
4. **Extract Posts, Users, or Trends**:
   - **Target Query**: Search for desired keywords (or paste the official EPA query).
   - Click **"Auto-Scroll"** to start collecting posts automatically in real time.
   - Click **"Preview"** at any time to inspect captured data in a structured table.
   - Click **"CSV"**, **"JSON"**, or **"Excel"** to export your collected dataset.

---

## 🔍 Official Punjab EPA Social Listening Query

To scrape posts specifically targeting smog emergencies and air quality in Pakistani Punjab while excluding Indian domestic noise and off-topic posts:

```text
(AQI OR "air quality" OR pollution OR smog or "clean air") 
(Lahore or gujranwala OR Pakistan OR Punjab) 
-Delhi -dehli -NCR -Haryana -Noida -Gurugram -India -india -india's 
-from:DelhiPollution -from:@ANI -from:@EPCCDpunjab -from:@EPAPunjab lang:en
```

Paste this query into the search bar on X.com, switch to the **Latest** tab, and start the scraper.

---

## 🔒 Security & Privacy Notice
- **100% Local**: All scraping, parsing, and export operations execute entirely inside the user's browser.
- **Zero Third-Party Calls**: No tracking, no external server pings, and no telemetry.
- **No API Keys Required**: Does not consume paid X Developer API quotas.
