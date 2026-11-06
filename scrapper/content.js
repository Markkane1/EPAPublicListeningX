
(() => {
  if (window.__X_SCRAPER_CONTENT_INITIALIZED__) return;
  window.__X_SCRAPER_CONTENT_INITIALIZED__ = true;

  const state = {
    posts: [],
    postIds: new Set(),
    users: [],
    userIds: new Set(),
    trends: [],
    trendNames: new Set(),
    activeTab: 'posts', 
    isAutoScrolling: false,
    scrollTimer: null,
    scrollDelay: 2000,
    scrollLimit: 0, 
    isMinimized: false
  };

  function updateBadge() {
    const count = getActiveCount();
    try {
      chrome.runtime.sendMessage({ type: 'UPDATE_BADGE', count });
    } catch (e) {}
  }

  function getActiveCount() {
    if (state.activeTab === 'posts') return state.posts.length;
    if (state.activeTab === 'users') return state.users.length;
    return state.trends.length;
  }

  function ingestPayload(payload) {
    if (!payload || !payload.data) return;

    let hasNew = false;
    
    const newPosts = XParser.extractPosts(payload.data, state.postIds);
    if (newPosts.length > 0) {
      state.posts.push(...newPosts);
      hasNew = true;
    }

    const newUsers = XParser.extractUsers(payload.data, state.userIds);
    if (newUsers.length > 0) {
      state.users.push(...newUsers);
      hasNew = true;
    }

    const newTrends = XParser.extractTrends(payload.data, state.trendNames);
    if (newTrends.length > 0) {
      state.trends.push(...newTrends);
      hasNew = true;
    }

    if (hasNew) {
      renderUiCounts();
      updateBadge();
    }
  }

  window.addEventListener('__X_SCRAPER_NETWORK_DATA__', (event) => {
    if (event.detail) {
      ingestPayload(event.detail);
    }
  });

  window.addEventListener('__X_SCRAPER_DRAIN_RESPONSE__', (event) => {
    if (Array.isArray(event.detail)) {
      event.detail.forEach(ingestPayload);
    }
  });

  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('__X_SCRAPER_REQUEST_DRAIN__'));
  }, 200);

  setInterval(() => {
    renderPageKind();
    if (state.activeTab === 'posts') {
      const domPosts = XParser.scrapeVisiblePostsDOM(state.postIds);
      if (domPosts.length > 0) {
        state.posts.push(...domPosts);
        renderUiCounts();
        updateBadge();
      }
    }
  }, 3000);

  async function performScrollStep() {
    if (!state.isAutoScrolling) return;

    const currentCount = getActiveCount();
    if (state.scrollLimit > 0 && currentCount >= state.scrollLimit) {
      stopAutoScroll('Limit reached');
      return;
    }

    const scrollAmount = 600 + Math.floor(Math.random() * 300);
    window.scrollBy({ top: scrollAmount, behavior: 'smooth' });

    if (state.activeTab === 'posts') {
      const domPosts = XParser.scrapeVisiblePostsDOM(state.postIds);
      if (domPosts.length > 0) {
        state.posts.push(...domPosts);
        renderUiCounts();
        updateBadge();
      }
    }

    if (state.scrollLimit > 0 && getActiveCount() >= state.scrollLimit) {
      stopAutoScroll('Limit reached');
      return;
    }

    const jitter = Math.floor(Math.random() * 500) - 250;
    const nextDelay = Math.max(800, state.scrollDelay + jitter);
    state.scrollTimer = setTimeout(performScrollStep, nextDelay);
  }

  function startAutoScroll() {
    if (state.isAutoScrolling) return;
    if (state.scrollLimit > 0 && getActiveCount() >= state.scrollLimit) {
      stopAutoScroll('Limit reached');
      return;
    }
    state.isAutoScrolling = true;
    updateScrollUi(true);
    performScrollStep();
  }

  function stopAutoScroll(reason) {
    state.isAutoScrolling = false;
    if (state.scrollTimer) {
      clearTimeout(state.scrollTimer);
      state.scrollTimer = null;
    }
    updateScrollUi(false);
    if (reason) {
      showStatusMessage(reason);
    }
  }

  let containerEl = null;

  function initUI() {
    if (document.getElementById('xps-floating-container')) return;

    containerEl = document.createElement('div');
    containerEl.id = 'xps-floating-container';

    const lockup = chrome.runtime.getURL('assets/epa-lockup.jpg');
    const wordmark = chrome.runtime.getURL('assets/epa-wordmark.png');
    containerEl.innerHTML = `
      <button type="button" id="xps-pill-btn" style="display: none;">
        <img src="${wordmark}" alt="">
        <span id="xps-pill-count">0 posts</span>
      </button>

      <div id="xps-panel">
        <div class="xps-header" id="xps-drag-handle" aria-label="Drag">
          <div class="xps-title-wrap">
            <img class="xps-lockup" src="${lockup}" alt="EPA Punjab">
          </div>
          <div class="xps-header-actions">
            <button type="button" class="xps-icon-btn" id="xps-btn-minimize" aria-label="Minimize">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14"/></svg>
            </button>
            <button type="button" class="xps-icon-btn" id="xps-btn-close" aria-label="Close panel">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div class="xps-body">
          <div class="xps-title-row">
            <h1>Collected</h1>
            <p id="xps-finding">0 posts on this search. Users still at 0.</p>
            <p id="xps-page-kind">This page.</p>
          </div>

          <div class="xps-tabs" role="tablist" aria-label="Collected on this page">
            <button type="button" class="xps-tab-btn active" data-tab="posts" role="tab" aria-selected="true">
              <span class="xps-tab-name">Posts</span>
              <span class="xps-tab-count is-zero" id="xps-count-posts">0</span>
            </button>
            <button type="button" class="xps-tab-btn" data-tab="users" role="tab" aria-selected="false">
              <span class="xps-tab-name">Users</span>
              <span class="xps-tab-count is-zero" id="xps-count-users">0</span>
            </button>
            <button type="button" class="xps-tab-btn" data-tab="trends" role="tab" aria-selected="false">
              <span class="xps-tab-name">Trends</span>
              <span class="xps-tab-count is-zero" id="xps-count-trends">0</span>
            </button>
          </div>

          <div class="xps-status-line">
            <span class="xps-dot" id="xps-status-dot"></span>
            <span id="xps-status-text">Ready</span>
            <span id="xps-tip">Scroll the page to collect</span>
          </div>

          <div class="xps-controls-grid">
            <button type="button" class="xps-btn xps-btn-primary" id="xps-btn-toggle-scroll">
              <span>Auto-scroll</span>
            </button>
            <button type="button" class="xps-btn xps-btn-secondary" id="xps-btn-preview" disabled>
              <span>Preview</span>
            </button>
          </div>

          <div class="xps-settings-bar">
            <div class="xps-field">
              <label for="xps-select-speed">Speed</label>
              <select id="xps-select-speed">
                <option value="1200">Fast, 1.2 s</option>
                <option value="2000" selected>Normal, 2 s</option>
                <option value="3500">Safe, 3.5 s</option>
              </select>
            </div>
            <div class="xps-field">
              <label for="xps-select-limit">Stop at</label>
              <select id="xps-select-limit">
                <option value="0" selected>No limit</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="250">250</option>
                <option value="500">500</option>
              </select>
            </div>
          </div>

          <div class="xps-export-group">
            <p class="xps-export-label" id="xps-export-label">Export posts</p>
            <div class="xps-export-buttons">
              <button type="button" class="xps-export-btn" id="xps-btn-export-csv" disabled>CSV</button>
              <button type="button" class="xps-export-btn" id="xps-btn-export-json" disabled>JSON</button>
              <button type="button" class="xps-export-btn" id="xps-btn-export-excel" disabled>Excel</button>
            </div>
          </div>

          <div class="xps-footer-row">
            <button type="button" class="xps-text-btn" id="xps-btn-clear" disabled>Clear posts</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(containerEl);
    attachUiListeners();
    makeDraggable(document.getElementById('xps-panel'), document.getElementById('xps-drag-handle'));
    renderUiCounts();
  }

  function activeNoun() {
    if (state.activeTab === 'users') return 'users';
    if (state.activeTab === 'trends') return 'trends';
    return 'posts';
  }

  function pageKindLabel() {
    const path = location.pathname || '';
    const parts = path.split('/').filter(Boolean);
    if (path.startsWith('/search')) return 'Search';
    if (path.startsWith('/explore') || path.startsWith('/i/trends')) return 'Explore';
    if (path === '/' || path === '/home' || path.startsWith('/home')) return 'Home';
    if (path.includes('/status/')) return 'Replies';
    if (path.endsWith('/followers') || path.endsWith('/verified_followers')) return 'Followers';
    if (path.endsWith('/following')) return 'Following';
    if (path.startsWith('/hashtag/')) return 'Hashtag';
    if (path.startsWith('/i/lists')) return 'List';
    if (parts.length === 1) return 'Profile';
    return 'This page';
  }

  function renderPageKind() {
    const el = document.getElementById('xps-page-kind');
    if (el) el.textContent = pageKindLabel();
  }

  function paintCount(el, value) {
    if (!el) return;
    const n = Number(value) || 0;
    el.textContent = n.toLocaleString('en');
    el.classList.toggle('is-zero', n === 0);
  }

  function renderUiCounts() {
    const postCount = state.posts.length;
    const userCount = state.users.length;
    const trendCount = state.trends.length;
    const activeCount = getActiveCount();
    const noun = activeNoun();

    paintCount(document.getElementById('xps-count-posts'), postCount);
    paintCount(document.getElementById('xps-count-users'), userCount);
    paintCount(document.getElementById('xps-count-trends'), trendCount);

    const pillCount = document.getElementById('xps-pill-count');
    if (pillCount) {
      pillCount.textContent = `${activeCount.toLocaleString('en')} ${noun}`;
      pillCount.classList.toggle('is-zero', activeCount === 0);
    }

    const exportLabel = document.getElementById('xps-export-label');
    if (exportLabel) exportLabel.textContent = `Export ${noun}`;
    const finding = document.getElementById('xps-finding');
    if (finding) {
      const postWord = postCount === 1 ? 'post' : 'posts';
      finding.textContent = `${postCount.toLocaleString('en')} ${postWord} on this search. Users still at ${userCount.toLocaleString('en')}.`;
    }

    ['csv', 'json', 'excel'].forEach((format) => {
      const btn = document.getElementById(`xps-btn-export-${format}`);
      if (btn) btn.disabled = activeCount === 0;
    });

    const preview = document.getElementById('xps-btn-preview');
    if (preview) preview.disabled = activeCount === 0;

    const clearBtn = document.getElementById('xps-btn-clear');
    if (clearBtn) {
      clearBtn.textContent = `Clear ${noun}`;
      clearBtn.disabled = activeCount === 0;
    }

    const tip = document.getElementById('xps-tip');
    if (tip) {
      if (state.isAutoScrolling && state.scrollLimit > 0) {
        tip.textContent = `Stops at ${state.scrollLimit.toLocaleString('en')}`;
      } else if (!state.isAutoScrolling && activeCount === 0) {
        tip.textContent = 'Scroll the page to collect.';
      } else {
        tip.textContent = '';
      }
    }

    renderPageKind();
  }

  function updateScrollUi(isRunning) {
    const btn = document.getElementById('xps-btn-toggle-scroll');
    const dot = document.getElementById('xps-status-dot');
    const text = document.getElementById('xps-status-text');
    if (isRunning) {
      if (btn) {
        btn.className = 'xps-btn xps-btn-primary';
        btn.innerHTML = '<span>Pause</span>';
        btn.setAttribute('aria-pressed', 'true');
      }
      if (dot) dot.className = 'xps-dot running';
      if (text) {
        text._xpsFlash = null;
        text.textContent = 'Scrolling';
      }
    } else {
      if (btn) {
        btn.className = 'xps-btn xps-btn-primary';
        btn.innerHTML = '<span>Auto-scroll</span>';
        btn.setAttribute('aria-pressed', 'false');
      }
      if (dot) dot.className = 'xps-dot';
      if (text) {
        text._xpsFlash = null;
        text.textContent = 'Ready';
      }
    }
    renderUiCounts();
  }

  function showStatusMessage(msg) {
    const text = document.getElementById('xps-status-text');
    if (!text) return;
    text.textContent = msg;
    const token = {};
    text._xpsFlash = token;
    setTimeout(() => {
      if (text._xpsFlash !== token) return;
      text.textContent = state.isAutoScrolling ? 'Scrolling' : 'Ready';
    }, 3000);
  }

  function attachUiListeners() {
    
    const tabBtns = containerEl.querySelectorAll('.xps-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        state.activeTab = btn.getAttribute('data-tab');
        renderUiCounts();
        updateBadge();
      });
    });

    const toggleScrollBtn = document.getElementById('xps-btn-toggle-scroll');
    if (toggleScrollBtn) {
      toggleScrollBtn.addEventListener('click', () => {
        if (state.isAutoScrolling) {
          stopAutoScroll('Paused');
        } else {
          startAutoScroll();
        }
      });
    }

    const speedSelect = document.getElementById('xps-select-speed');
    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        state.scrollDelay = parseInt(e.target.value, 10);
      });
    }

    const limitSelect = document.getElementById('xps-select-limit');
    if (limitSelect) {
      limitSelect.addEventListener('change', (e) => {
        state.scrollLimit = parseInt(e.target.value, 10);
        renderUiCounts();
      });
    }

    const btnCsv = document.getElementById('xps-btn-export-csv');
    if (btnCsv) btnCsv.addEventListener('click', () => exportCurrent('csv'));

    const btnJson = document.getElementById('xps-btn-export-json');
    if (btnJson) btnJson.addEventListener('click', () => exportCurrent('json'));

    const btnExcel = document.getElementById('xps-btn-export-excel');
    if (btnExcel) btnExcel.addEventListener('click', () => exportCurrent('excel'));

    const btnClear = document.getElementById('xps-btn-clear');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        const noun = activeNoun();
        const count = getActiveCount().toLocaleString('en');
        askClear(count, noun).then((ok) => {
          if (!ok) return;
          if (state.activeTab === 'posts') {
            state.posts = [];
            state.postIds.clear();
          } else if (state.activeTab === 'users') {
            state.users = [];
            state.userIds.clear();
          } else {
            state.trends = [];
            state.trendNames.clear();
          }
          renderUiCounts();
          updateBadge();
        });
      });
    }

    const btnPreview = document.getElementById('xps-btn-preview');
    if (btnPreview) {
      btnPreview.addEventListener('click', openPreviewModal);
    }

    const btnMin = document.getElementById('xps-btn-minimize');
    const pillBtn = document.getElementById('xps-pill-btn');
    const panel = document.getElementById('xps-panel');
    const btnClose = document.getElementById('xps-btn-close');

    if (btnMin && pillBtn && panel) {
      btnMin.addEventListener('click', () => {
        panel.style.display = 'none';
        pillBtn.style.display = 'flex';
        state.isMinimized = true;
      });

      pillBtn.addEventListener('click', () => {
        pillBtn.style.display = 'none';
        panel.style.display = 'flex';
        state.isMinimized = false;
      });
    }

    if (btnClose && panel) {
      btnClose.addEventListener('click', () => {
        if (state.isAutoScrolling) stopAutoScroll();
        panel.style.display = 'none';
        pillBtn.style.display = 'flex';
      });
    }
  }

  function getCurrentTabData() {
    if (state.activeTab === 'posts') return state.posts;
    if (state.activeTab === 'users') return state.users;
    return state.trends;
  }

  function exportCurrent(format) {
    const data = getCurrentTabData();
    if (!data.length) {
      showStatusMessage('Nothing collected yet');
      return false;
    }
    const name = `epa_x_${state.activeTab}`;
    if (format === 'json') XExporter.exportToJson(data, name);
    else if (format === 'excel') XExporter.exportToExcel(data, name);
    else XExporter.exportToCsv(data, name);
    const saved = format === 'json' ? 'Saved JSON' : format === 'excel' ? 'Saved Excel' : 'Saved CSV';
    showStatusMessage(saved);
    return true;
  }

  const HEADER_LABELS = {
    id: 'Id',
    type: 'Type',
    postUrl: 'Post',
    text: 'Text',
    createdAt: 'Posted',
    language: 'Language',
    likes: 'Likes',
    retweets: 'Reposts',
    replies: 'Replies',
    quotes: 'Quotes',
    bookmarks: 'Bookmarks',
    views: 'Views',
    authorName: 'Name',
    authorUsername: 'Username',
    authorFollowers: 'Followers',
    authorFollowing: 'Following',
    authorDescription: 'Bio',
    authorVerified: 'Verified',
    authorAvatar: 'Photo',
    authorBanner: 'Banner',
    mediaUrls: 'Media',
    mediaTypes: 'Media type',
    username: 'Username',
    name: 'Name',
    url: 'Link',
    description: 'Bio',
    location: 'Location',
    website: 'Website',
    joinDate: 'Joined',
    followers: 'Followers',
    following: 'Following',
    totalPosts: 'Posts',
    mediaCount: 'Media',
    likesCount: 'Likes',
    isVerified: 'Verified',
    isBlueVerified: 'Blue verified',
    avatar: 'Photo',
    banner: 'Banner',
    rank: 'Rank',
    domainContext: 'Context',
    metaDescription: 'Detail'
  };

  const NUMERIC_KEYS = new Set([
    'likes', 'retweets', 'replies', 'quotes', 'bookmarks', 'views',
    'authorFollowers', 'authorFollowing', 'followers', 'following',
    'totalPosts', 'mediaCount', 'likesCount', 'rank'
  ]);

  const DATE_KEYS = new Set(['createdAt', 'joinDate']);
  const LINK_KEYS = new Set(['postUrl', 'url', 'website', 'authorBanner', 'banner']);
  const AVATAR_KEYS = new Set(['authorAvatar', 'avatar']);

  function headerLabel(key) {
    if (HEADER_LABELS[key]) return HEADER_LABELS[key];
    const spaced = String(key).replace(/([A-Z])/g, ' $1').replace(/[_-]+/g, ' ').trim();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }

  function formatPreviewValue(key, val) {
    if (val === null || val === undefined || val === '') return { text: '', dash: true };
    if (typeof val === 'boolean') return { text: val ? 'Yes' : 'No' };
    if (NUMERIC_KEYS.has(key)) {
      const num = Number(val);
      if (Number.isFinite(num)) return { text: num.toLocaleString('en'), num: true };
    }
    if (DATE_KEYS.has(key)) {
      const d = new Date(val);
      if (!Number.isNaN(d.getTime())) {
        return { text: d.toISOString().slice(0, 16).replace('T', ' ') };
      }
    }
    return { text: String(val) };
  }

  function previewNote(matched, sourceTotal) {
    if (!matched) return 'No rows match.';
    if (matched > 100) {
      return `First 100 of ${matched.toLocaleString('en')}. Export includes every row.`;
    }
    if (matched !== sourceTotal) return `${matched.toLocaleString('en')} match.`;
    return '';
  }

  function askClear(countLabel, noun) {
    return new Promise((resolve) => {
      const existing = document.getElementById('xps-confirm');
      if (existing) existing.remove();
      const modal = document.createElement('div');
      modal.id = 'xps-confirm';
      modal.innerHTML = `
        <div class="xps-confirm-box" role="dialog" aria-modal="true" aria-labelledby="xps-confirm-title">
          <h2 id="xps-confirm-title" class="xps-modal-title">Clear ${escapeHtml(countLabel)} ${escapeHtml(noun)}?</h2>
          <div class="xps-confirm-actions">
            <button type="button" class="xps-btn xps-btn-secondary" id="xps-confirm-cancel">Cancel</button>
            <button type="button" class="xps-text-btn" id="xps-confirm-ok">Clear</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      const cancel = modal.querySelector('#xps-confirm-cancel');
      const ok = modal.querySelector('#xps-confirm-ok');
      const clearBtn = document.getElementById('xps-btn-clear');
      function finish(accepted) {
        document.removeEventListener('keydown', onKey);
        modal.remove();
        if (clearBtn) clearBtn.focus();
        resolve(accepted);
      }
      function onKey(e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          finish(false);
        }
      }
      cancel.addEventListener('click', () => finish(false));
      ok.addEventListener('click', () => finish(true));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) finish(false);
      });
      document.addEventListener('keydown', onKey);
      cancel.focus();
    });
  }

  function openPreviewModal() {
    const existing = document.getElementById('xps-preview-modal');
    if (existing) existing.remove();

    const data = getCurrentTabData();
    if (!data.length) {
      showStatusMessage('Nothing to preview yet');
      return;
    }

    const noun = activeNoun();
    const titleNoun = noun.charAt(0).toUpperCase() + noun.slice(1);
    const headers = Object.keys(data[0]);
    const modal = document.createElement('div');
    modal.id = 'xps-preview-modal';

    modal.innerHTML = `
      <div class="xps-modal-box" role="dialog" aria-modal="true" aria-labelledby="xps-modal-title">
        <div class="xps-modal-header">
          <div class="xps-modal-heading">
            <h2 class="xps-modal-title" id="xps-modal-title">${escapeHtml(titleNoun)} <span class="xps-num">${data.length.toLocaleString('en')}</span></h2>
            <p class="xps-modal-note" id="xps-preview-note">${escapeHtml(previewNote(data.length, data.length))}</p>
          </div>
          <div class="xps-filter">
            <label for="xps-modal-filter">Filter</label>
            <input type="text" class="xps-modal-search" id="xps-modal-filter" autocomplete="off">
          </div>
          <button type="button" class="xps-icon-btn" id="xps-modal-close" aria-label="Close preview">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="xps-modal-body">
          <table class="xps-table" id="xps-preview-table">
            <thead>
              <tr>
                ${headers.map(h => `<th${NUMERIC_KEYS.has(h) ? ' class="xps-num"' : ''}>${escapeHtml(headerLabel(h))}</th>`).join('')}
              </tr>
            </thead>
            <tbody id="xps-preview-tbody">
              ${renderTableRows(data, headers)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const finish = () => {
      document.removeEventListener('keydown', onKey);
      modal.remove();
      const previewBtn = document.getElementById('xps-btn-preview');
      if (previewBtn) previewBtn.focus();
    };

    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        finish();
      }
    }

    document.getElementById('xps-modal-close').addEventListener('click', finish);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) finish();
    });
    document.addEventListener('keydown', onKey);

    const filterInput = document.getElementById('xps-modal-filter');
    const noteEl = document.getElementById('xps-preview-note');
    filterInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = data.filter(row => Object.values(row).some(v => String(v == null ? '' : v).toLowerCase().includes(q)));
      document.getElementById('xps-preview-tbody').innerHTML = renderTableRows(filtered, headers);
      if (noteEl) noteEl.textContent = previewNote(filtered.length, data.length);
    });
    filterInput.focus();
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function sanitizeUrl(url) {
    if (!url) return '#';
    const s = String(url).trim();
    if (/^(https?:\/\/|\/)/i.test(s)) {
      return escapeHtml(s);
    }
    return '#';
  }

  function renderTableRows(rows, headers) {
    if (!rows.length) {
      return `<tr class="xps-empty-row"><td colspan="${headers.length}">No rows match.</td></tr>`;
    }
    return rows.slice(0, 100).map(row => `
      <tr>
        ${headers.map(h => {
          const val = row[h];
          if (LINK_KEYS.has(h)) {
            const safeUrl = sanitizeUrl(val);
            if (safeUrl === '#') return '<td class="xps-dash"><span class="xps-miss" role="img" aria-label="Missing"></span></td>';
            return `<td><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">Open</a></td>`;
          }
          if (AVATAR_KEYS.has(h)) {
            const safeAvatar = sanitizeUrl(val);
            return safeAvatar !== '#' ? `<td><img src="${safeAvatar}" class="xps-user-avatar" alt=""></td>` : '<td class="xps-dash"><span class="xps-miss" role="img" aria-label="Missing"></span></td>';
          }
          const cell = formatPreviewValue(h, val);
          const escaped = escapeHtml(cell.text);
          if (cell.dash) return '<td class="xps-dash"><span class="xps-miss" role="img" aria-label="Missing"></span></td>';
          const cls = cell.num ? ' class="xps-num"' : '';
          return `<td${cls} title="${escaped}">${escaped}</td>`;
        }).join('')}
      </tr>
    `).join('');
  }

  function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      if (window.matchMedia('(max-width: 640px)').matches) return;
      if (e.target.closest('button') || e.target.closest('input')) return;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;

      const newTop = element.offsetTop - pos2;
      const newLeft = element.offsetLeft - pos1;

      const min = 24;
      element.style.top = Math.max(min - element.offsetHeight, Math.min(window.innerHeight - min, newTop)) + 'px';
      element.style.left = Math.max(min - element.offsetWidth, Math.min(window.innerWidth - min, newLeft)) + 'px';
      element.style.bottom = 'auto';
      element.style.right = 'auto';
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SHOW_OVERLAY') {
      initUI();
      const panel = document.getElementById('xps-panel');
      const pill = document.getElementById('xps-pill-btn');
      if (panel) panel.style.display = 'flex';
      if (pill) pill.style.display = 'none';
      state.isMinimized = false;
      sendResponse({ success: true, count: getActiveCount() });
      return true;
    }

    if (msg.type === 'SET_TAB') {
      const next = msg.tab === 'users' || msg.tab === 'trends' ? msg.tab : 'posts';
      const btn = containerEl && containerEl.querySelector(`.xps-tab-btn[data-tab="${next}"]`);
      if (btn) btn.click();
      else state.activeTab = next;
      sendResponse({ success: true, activeTab: state.activeTab });
      return true;
    }

    if (msg.type === 'GET_STATUS') {
      sendResponse({
        activeTab: state.activeTab,
        postsCount: state.posts.length,
        usersCount: state.users.length,
        trendsCount: state.trends.length,
        isAutoScrolling: state.isAutoScrolling,
        pageKind: pageKindLabel()
      });
      return true;
    }

    if (msg.type === 'START_AUTO_SCROLL') {
      startAutoScroll();
      sendResponse({ success: true });
      return true;
    }

    if (msg.type === 'STOP_AUTO_SCROLL') {
      stopAutoScroll();
      sendResponse({ success: true });
      return true;
    }

    if (msg.type === 'EXPORT_DATA') {
      const format = msg.format === 'json' || msg.format === 'excel' ? msg.format : 'csv';
      const ok = exportCurrent(format);
      sendResponse({ success: ok });
      return true;
    }
  });

  initUI();
  console.log('[EPA Punjab Social Listening] Content script ready and floating panel initialized.');
})();