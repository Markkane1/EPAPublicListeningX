
chrome.runtime.onInstalled.addListener(() => {
  console.log('[EPA Punjab Social Listening] Service worker installed.');
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'UPDATE_BADGE' && sender.tab?.id) {
    const tabId = sender.tab.id;
    const count = msg.count || 0;
    const text = count > 999 ? '999+' : (count > 0 ? String(count) : '');

    chrome.action.setBadgeText({ tabId, text });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#1d9bf0' });
    sendResponse({ success: true });
    return true;
  }

  if (msg.type === 'DOWNLOAD_FILE') {
    chrome.downloads.download({
      url: msg.url,
      filename: msg.filename,
      saveAs: Boolean(msg.saveAs)
    }, (downloadId) => {
      sendResponse({ success: Boolean(downloadId), downloadId });
    });
    return true;
  }
});