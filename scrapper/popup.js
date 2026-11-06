document.addEventListener('DOMContentLoaded', async () => {
  const activeView = document.getElementById('target-active-view');
  const inactiveView = document.getElementById('target-inactive-view');
  const pageKindEl = document.getElementById('pop-page-kind');
  const noteEl = document.getElementById('pop-note');
  const btnToggleOverlay = document.getElementById('btn-toggle-overlay');
  const btnOpenX = document.getElementById('btn-open-x');
  const btnAutoScroll = document.getElementById('pop-btn-autoscroll');
  const autoScrollText = document.getElementById('pop-autoscroll-text');
  const statusText = document.getElementById('pop-status-text');
  const statusDot = document.getElementById('pop-status-dot');
  const hintEl = document.getElementById('pop-hint');
  const exportLabel = document.getElementById('pop-export-label');
  const findingEl = document.getElementById('pop-finding');
  const tallyButtons = Array.from(document.querySelectorAll('.cell'));
  const countEls = {
    posts: document.getElementById('pop-posts-count'),
    users: document.getElementById('pop-users-count'),
    trends: document.getElementById('pop-trends-count')
  };
  const exportButtons = {
    csv: document.getElementById('pop-export-csv'),
    json: document.getElementById('pop-export-json'),
    excel: document.getElementById('pop-export-excel')
  };

  const nouns = { posts: 'posts', users: 'users', trends: 'trends' };
  let activeTabId = null;
  let activeKind = 'posts';
  let counts = { posts: 0, users: 0, trends: 0 };
  let isScrolling = false;
  let noteTimer = null;

  function formatCount(n) {
    return Number(n || 0).toLocaleString('en');
  }

  function nounFor(kind, n) {
    const count = Number(n) || 0;
    if (kind === 'users') return count === 1 ? 'user' : 'users';
    if (kind === 'trends') return count === 1 ? 'trend' : 'trends';
    return count === 1 ? 'post' : 'posts';
  }

  function setNote(message) {
    noteEl.textContent = message || '';
    if (noteTimer) clearTimeout(noteTimer);
    if (message) {
      noteTimer = setTimeout(() => {
        noteEl.textContent = '';
      }, 3500);
    }
  }

  function paint() {
    tallyButtons.forEach((btn) => {
      const kind = btn.getAttribute('data-kind');
      const selected = kind === activeKind;
      btn.setAttribute('aria-checked', selected ? 'true' : 'false');
      const value = counts[kind] || 0;
      countEls[kind].textContent = formatCount(value);
      countEls[kind].classList.toggle('is-zero', value === 0);
    });

    const noun = nouns[activeKind] || 'posts';
    const current = counts[activeKind] || 0;
    exportLabel.textContent = `Export ${noun}`;
    if (findingEl) {
      const posts = counts.posts || 0;
      findingEl.textContent = `${posts.toLocaleString('en')} ${nounFor('posts', posts)} on this search. Users still at ${counts.users || 0}.`;
    }
    Object.values(exportButtons).forEach((btn) => {
      btn.disabled = current === 0;
    });

    isScrolling = Boolean(isScrolling);
    statusText.textContent = isScrolling ? 'Scrolling' : 'Ready';
    statusDot.classList.toggle('is-run', isScrolling);
    hintEl.textContent = !isScrolling && current === 0 ? 'Scroll the page to collect.' : '';
    autoScrollText.textContent = isScrolling ? 'Pause' : 'Auto-scroll';
    btnAutoScroll.setAttribute('aria-pressed', isScrolling ? 'true' : 'false');
  }

  function showInactive() {
    const liveTitle = activeView.querySelector('h1');
    if (liveTitle) liveTitle.remove();
    const awayHead = document.getElementById('away-head');
    if (awayHead && !awayHead.querySelector('h1')) {
      const title = document.createElement('h1');
      title.textContent = 'Open X';
      awayHead.prepend(title);
    }
    activeView.hidden = true;
    inactiveView.hidden = false;
    pageKindEl.textContent = 'Not on X.';
    btnOpenX.addEventListener('click', () => {
      if (!chrome?.tabs) return;
      chrome.tabs.create({ url: 'https://x.com/explore' });
      window.close();
    });
  }

  if (!chrome?.tabs) {
    showInactive();
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) return;

  const isX = tab.url.includes('x.com') || tab.url.includes('twitter.com');
  if (!isX) {
    showInactive();
    return;
  }

  activeTabId = tab.id;
  activeView.hidden = false;
  inactiveView.hidden = true;

  function applyStatus(res) {
    if (!res) return;
    counts = {
      posts: res.postsCount || 0,
      users: res.usersCount || 0,
      trends: res.trendsCount || 0
    };
    if (res.activeTab === 'posts' || res.activeTab === 'users' || res.activeTab === 'trends') {
      activeKind = res.activeTab;
    }
    isScrolling = Boolean(res.isAutoScrolling);
    if (res.pageKind) pageKindEl.textContent = res.pageKind;
    paint();
  }

  async function refreshStatus() {
    try {
      const res = await chrome.tabs.sendMessage(activeTabId, { type: 'GET_STATUS' });
      applyStatus(res);
    } catch (e) {
      pageKindEl.textContent = 'This page';
    }
  }

  await refreshStatus();
  setInterval(refreshStatus, 1500);

  tallyButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const kind = btn.getAttribute('data-kind');
      activeKind = kind;
      paint();
      try {
        await chrome.tabs.sendMessage(activeTabId, { type: 'SET_TAB', tab: kind });
      } catch (e) {
        setNote('Refresh this X tab, then try again.');
      }
    });
  });

  btnToggleOverlay.addEventListener('click', async () => {
    try {
      await chrome.tabs.sendMessage(activeTabId, { type: 'SHOW_OVERLAY' });
      window.close();
    } catch (e) {
      setNote('Refresh this X tab, then open the panel again.');
    }
  });

  btnAutoScroll.addEventListener('click', async () => {
    try {
      await chrome.tabs.sendMessage(activeTabId, {
        type: isScrolling ? 'STOP_AUTO_SCROLL' : 'START_AUTO_SCROLL'
      });
      await refreshStatus();
    } catch (e) {
      setNote('Could not reach this X tab. Refresh it and try again.');
    }
  });

  function exportAs(format, savedLabel) {
    chrome.tabs.sendMessage(activeTabId, { type: 'EXPORT_DATA', format }, (res) => {
      if (chrome.runtime.lastError || !res || !res.success) {
        setNote(`Nothing collected for ${nouns[activeKind]} yet.`);
        return;
      }
      setNote(savedLabel);
    });
  }

  exportButtons.csv.addEventListener('click', () => exportAs('csv', 'Saved CSV.'));
  exportButtons.json.addEventListener('click', () => exportAs('json', 'Saved JSON.'));
  exportButtons.excel.addEventListener('click', () => exportAs('excel', 'Saved Excel.'));
});
