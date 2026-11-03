
document.addEventListener('DOMContentLoaded', async () => {
  const activeView = document.getElementById('target-active-view');
  const inactiveView = document.getElementById('target-inactive-view');
  const btnToggleOverlay = document.getElementById('btn-toggle-overlay');
  const btnOpenX = document.getElementById('btn-open-x');
  const btnAutoScroll = document.getElementById('pop-btn-autoscroll');
  const autoScrollText = document.getElementById('pop-autoscroll-text');

  const popPostsCount = document.getElementById('pop-posts-count');
  const popUsersCount = document.getElementById('pop-users-count');
  const popTrendsCount = document.getElementById('pop-trends-count');

  const btnExportCsv = document.getElementById('pop-export-csv');
  const btnExportJson = document.getElementById('pop-export-json');
  const btnExportExcel = document.getElementById('pop-export-excel');

  let activeTabId = null;
  let isScrolling = false;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) return;

  const isX = tab.url.includes('x.com') || tab.url.includes('twitter.com');
  if (!isX) {
    activeView.style.display = 'none';
    inactiveView.style.display = 'block';

    btnOpenX.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://x.com' });
      window.close();
    });
    return;
  }

  activeTabId = tab.id;
  activeView.style.display = 'block';
  inactiveView.style.display = 'none';

  async function refreshStatus() {
    try {
      const res = await chrome.tabs.sendMessage(activeTabId, { type: 'GET_STATUS' });
      if (res) {
        popPostsCount.textContent = String(res.postsCount || 0);
        popUsersCount.textContent = String(res.usersCount || 0);
        popTrendsCount.textContent = String(res.trendsCount || 0);

        isScrolling = Boolean(res.isAutoScrolling);
        if (isScrolling) {
          btnAutoScroll.className = 'btn-primary running';
          autoScrollText.textContent = 'Pause Auto-Scroll';
        } else {
          btnAutoScroll.className = 'btn-primary';
          autoScrollText.textContent = 'Start Auto-Scroll';
        }
      }
    } catch (e) {
      
    }
  }

  await refreshStatus();
  setInterval(refreshStatus, 1500);

  btnToggleOverlay.addEventListener('click', async () => {
    try {
      await chrome.tabs.sendMessage(activeTabId, { type: 'SHOW_OVERLAY' });
      window.close();
    } catch (e) {
      alert('Please refresh the X.com tab to initialize the scraper.');
    }
  });

  btnAutoScroll.addEventListener('click', async () => {
    try {
      if (isScrolling) {
        await chrome.tabs.sendMessage(activeTabId, { type: 'STOP_AUTO_SCROLL' });
      } else {
        await chrome.tabs.sendMessage(activeTabId, { type: 'START_AUTO_SCROLL' });
      }
      refreshStatus();
    } catch (e) {
      alert('Could not toggle auto-scroll. Make sure the X.com page is active.');
    }
  });

  btnExportCsv.addEventListener('click', () => {
    chrome.tabs.sendMessage(activeTabId, { type: 'EXPORT_DATA', format: 'csv' });
  });

  btnExportJson.addEventListener('click', () => {
    chrome.tabs.sendMessage(activeTabId, { type: 'EXPORT_DATA', format: 'json' });
  });

  btnExportExcel.addEventListener('click', () => {
    chrome.tabs.sendMessage(activeTabId, { type: 'EXPORT_DATA', format: 'excel' });
  });
});