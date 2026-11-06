# 𝕏 EPA Punjab Social Listening: Export Posts, Users & Trends

A powerful, independent, 100% unlocked Chrome extension to scrape and export posts, tweets, user profiles, followers, following, and trending topics directly from **X (formerly Twitter)** into **CSV**, **JSON**, and **Excel (.xls)** formats.

All data collection and exports run **100% locally** in your browser. No external API keys required, no rate limit charges, no subscription paywalls, and no data tracking.

---

## 🚀 Key Features

* **Real-Time Network Interception**: Directly captures raw GraphQL API responses from X.com as they load (giving 100% accurate engagement stats, full un-truncated post text, and media URLs).
* **DOM Scrape Fallback**: Automatically captures already-visible posts on screen even before scrolling.
* **Auto-Scroll Engine**: Progressive, smooth scrolling with human-like jitter delays (customizable: Fast 1.2s, Normal 2.0s, Safe 3.5s) and optional batch limits (e.g. 50, 100, 250, 500, or Unlimited).
* **Multi-Tab Mode**:
  * 📝 **Posts**: Feeds, user timelines, search queries, hashtags, tweet replies.
  * 👤 **Users**: Followers lists, following lists, verified users, search results.
  * 🔥 **Trends**: Explore page trending topics, rankings, and domain contexts.
* **In-Page Floating UI**: Draggable, collapsible floating control panel directly on X.com.
* **Data Preview Modal**: Searchable, responsive data table to preview collected records before exporting.
* **Universal Export**:
  * **CSV** (with UTF-8 BOM so Excel opens emojis and special characters cleanly)
  * **JSON** (structured array)
  * **Excel** (.xls spreadsheet format)

---

## 📊 Extracted Data Fields

### 1. Posts & Tweets
* **Identifiers & Links**: Post ID, Post Permalink URL (`https://x.com/user/status/123...`), Created Date & Time, Language
* **Content**: Full text (including long-form NoteTweets), Tweet Type (Post / Retweet / Quote)
* **Metrics**: Views Count, Likes, Retweets, Replies, Quotes, Bookmarks
* **Author Details**: Name, Username / Screen name, Verified Status (Blue / Organization / Legacy), Avatar URL, Banner URL, Bio/Description, Follower Count, Following Count
* **Media Assets**: High-resolution image URLs, highest-bitrate MP4 video download URLs, animated GIF URLs, media types

### 2. User Profiles
* Rest ID, Username, Display Name, Profile URL
* Bio / Description, Location, Website / Legacy URL, Account Creation Date
* Followers Count, Following Count, Total Posts Count, Media Count, Likes Count
* Verification Badges (Blue Verified, Legacy Verified), Avatar & Banner URLs

### 3. Trending Topics
* Trend Name, Rank, Search URL, Domain Context, Category metadata

---

## 🎁 Shareable Extension Packages (Ready to Distribute)

Pre-built packages ready to share with other people are available in [`scrapper/release/`](file:///D:/web%20temps/EPA%20X%20Scrapper/scrapper/release):

* **`epa-x-scrapper-v1.0.0.zip`** (113 KB): Standard portable zip archive. Perfect for emailing, Slack, Google Drive, or Chrome Web Store upload.
* **`epa-x-scrapper-v1.0.0.crx`** (115 KB): Signed Chromium packed extension for direct drag-and-drop installation.
* **`quick_install.bat`**: Windows 1-click installer that opens the browser extensions page and directory.
* **`INSTALLATION_GUIDE.md`**: Complete non-technical visual guide for recipients.

---

## 📦 How to Install in Chrome / Brave / Edge

1. Open your browser and navigate to the Extensions management page:
   * **Chrome**: `chrome://extensions`
   * **Brave**: `brave://extensions`
   * **Edge**: `edge://extensions`
2. Enable **Developer mode** (toggle switch in the top right corner).
3. Click the **Load unpacked** button in the top left corner.
4. Select the packaged extension folder (preferred):
   ```
   D:\web temps\X Scrapper\release\extension
   ```
   You can also load the project folder itself (`D:\web temps\X Scrapper`) as long as it does **not** contain `__pycache__`. Chrome rejects any file or folder whose name starts with `_`.
5. The extension **EPA Punjab Social Listening** will appear in your extensions list.
6. Pin the extension to your toolbar for easy access.

---

## 🔍 Official EPA Search Query

For monitoring Punjab AQI and smog while excluding Indian domestic pollution and noise, use the query in `Query.txt`:

```text
(AQI OR "air quality" OR pollution OR smog or "clean air") 
(Lahore or gujranwala OR Pakistan OR Punjab) 
-Delhi -dehli -NCR -Haryana -Noida -Gurugram -India -india -india's 
-from:DelhiPollution -from:@ANI -from:@EPCCDpunjab -from:@EPAPunjab lang:en
```

Paste this query into the X.com search bar, switch to **Latest**, and enable **Auto-Scroll** in the EPA X Scrapper panel.

---

## 🎯 How to Use

1. Navigate to any page on [X.com](https://x.com) (e.g., your Home feed, a search result, a profile's posts, or a user's `/followers` page).
2. The **EPA X Scrapper** floating panel will appear on the bottom-right of the page.
   * If minimized, click the floating **[ 𝕏 Scraper ]** pill to expand it.
   * You can also click the extension icon in your browser toolbar and click **Show Panel**.
3. Select your desired tab (**Posts**, **Users**, or **Trends**).
4. Click **Auto-Scroll** to let the scraper automatically scroll down and ingest data in real-time.
5. Click **Preview** at any time to inspect the collected rows in a table.
6. Click **CSV**, **JSON**, or **Excel** to download your exported dataset.

---

## 🔒 Privacy & Safety

* **Zero External Calls**: Unlike commercial extensions that phone home to paid licensing servers (e.g. `nifty.codes`), this clone has zero third-party telemetry or remote trackers.
* **Human-like Scrolling**: The auto-scroller includes randomized jitter to avoid rapid bot-like scrolling.
* **Local Storage**: All data exists only in your browser's local session memory until you decide to export or clear it.
