
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
      stopAutoScroll('Target limit reached!');
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
      stopAutoScroll('Target limit reached!');
      return;
    }

    const jitter = Math.floor(Math.random() * 500) - 250;
    const nextDelay = Math.max(800, state.scrollDelay + jitter);
    state.scrollTimer = setTimeout(performScrollStep, nextDelay);
  }

  function startAutoScroll() {
    if (state.isAutoScrolling) return;
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

    containerEl.innerHTML = `
      <!-- Minimized Pill Button -->
      <div id="xps-pill-btn" style="display: none;">
        <img src="${chrome.runtime.getURL('icons/icon48.png')}" width="18" height="18" style="border-radius:3px; object-fit:contain;"/>
        <span>EPA Scraper</span>
        <span class="xps-badge-counter" id="xps-pill-count">0</span>
      </div>

      <!-- Main Floating Panel -->
      <div id="xps-panel">
        <div class="xps-header" id="xps-drag-handle">
          <div class="xps-title-wrap">
            <img src="${chrome.runtime.getURL('icons/icon48.png')}" width="20" height="20" style="border-radius:4px; object-fit:contain;"/>
            <span>EPA Punjab Social Listening</span>
          </div>
          <div class="xps-header-actions">
            <button class="xps-icon-btn" id="xps-btn-minimize" title="Minimize">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/></svg>
            </button>
            <button class="xps-icon-btn" id="xps-btn-close" title="Close Panel">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div class="xps-tabs">
          <button class="xps-tab-btn active" data-tab="posts">
            <span>Posts</span>
            <span class="xps-tab-count" id="xps-count-posts">0</span>
          </button>
          <button class="xps-tab-btn" data-tab="users">
            <span>Users</span>
            <span class="xps-tab-count" id="xps-count-users">0</span>
          </button>
          <button class="xps-tab-btn" data-tab="trends">
            <span>Trends</span>
            <span class="xps-tab-count" id="xps-count-trends">0</span>
          </button>
        </div>

        <div class="xps-body">
          <div class="xps-status-card">
            <div class="xps-status-indicator">
              <span class="xps-dot" id="xps-status-dot"></span>
              <span id="xps-status-text">Ready</span>
            </div>
            <div class="xps-count-display" id="xps-active-count">0</div>
          </div>

          <div class="xps-controls-grid">
            <button class="xps-btn xps-btn-primary" id="xps-btn-toggle-scroll">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              <span>Auto-Scroll</span>
            </button>
            <button class="xps-btn xps-btn-secondary" id="xps-btn-preview">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>Preview</span>
            </button>
          </div>

          <div class="xps-settings-bar">
            <div>
              <label>Speed: </label>
              <select id="xps-select-speed">
                <option value="1200">Fast (1.2s)</option>
                <option value="2000" selected>Normal (2.0s)</option>
                <option value="3500">Safe (3.5s)</option>
              </select>
            </div>
            <div>
              <label>Limit: </label>
              <select id="xps-select-limit">
                <option value="0" selected>No Limit</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="250">250</option>
                <option value="500">500</option>
              </select>
            </div>
          </div>

          <div class="xps-export-group">
            <div class="xps-export-label">Export Collected Data</div>
            <div class="xps-export-buttons">
              <button class="xps-export-btn" id="xps-btn-export-csv">CSV</button>
              <button class="xps-export-btn" id="xps-btn-export-json">JSON</button>
              <button class="xps-export-btn" id="xps-btn-export-excel">Excel</button>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
            <button class="xps-icon-btn" id="xps-btn-clear" style="font-size:11px; padding:4px 8px; color:#f4212e;" title="Clear Buffer">
              🗑 Clear Data
            </button>
            <span style="font-size:11px; color:#71767b;" id="xps-tip">Scroll page to collect</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(containerEl);
    attachUiListeners();
    makeDraggable(document.getElementById('xps-panel'), document.getElementById('xps-drag-handle'));
  }

  function renderUiCounts() {
    const postCount = state.posts.length;
    const userCount = state.users.length;
    const trendCount = state.trends.length;
    const activeCount = getActiveCount();

    const postEl = document.getElementById('xps-count-posts');
    const userEl = document.getElementById('xps-count-users');
    const trendEl = document.getElementById('xps-count-trends');
    const activeEl = document.getElementById('xps-active-count');
    const pillCount = document.getElementById('xps-pill-count');

    if (postEl) postEl.textContent = String(postCount);
    if (userEl) userEl.textContent = String(userCount);
    if (trendEl) trendEl.textContent = String(trendCount);
    if (activeEl) activeEl.textContent = String(activeCount);
    if (pillCount) pillCount.textContent = String(activeCount);
  }

  function updateScrollUi(isRunning) {
    const btn = document.getElementById('xps-btn-toggle-scroll');
    const dot = document.getElementById('xps-status-dot');
    const text = document.getElementById('xps-status-text');

    if (isRunning) {
      if (btn) {
        btn.className = 'xps-btn xps-btn-stop';
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg><span>Pause</span>`;
      }
      if (dot) dot.className = 'xps-dot running';
      if (text) text.textContent = 'Auto-Scraping...';
    } else {
      if (btn) {
        btn.className = 'xps-btn xps-btn-primary';
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><span>Auto-Scroll</span>`;
      }
      if (dot) dot.className = 'xps-dot';
      if (text) text.textContent = 'Ready';
    }
  }

  function showStatusMessage(msg) {
    const text = document.getElementById('xps-status-text');
    if (text) {
      const orig = text.textContent;
      text.textContent = msg;
      setTimeout(() => {
        text.textContent = orig;
      }, 3000);
    }
  }

  function attachUiListeners() {
    
    const tabBtns = containerEl.querySelectorAll('.xps-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeTab = btn.getAttribute('data-tab');
        renderUiCounts();
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
      });
    }

    const btnCsv = document.getElementById('xps-btn-export-csv');
    if (btnCsv) {
      btnCsv.addEventListener('click', () => {
        const data = getCurrentTabData();
        if (!data.length) return alert('No data collected yet. Scroll the page to capture items!');
        XExporter.exportToCsv(data, `epa_x_${state.activeTab}`);
      });
    }

    const btnJson = document.getElementById('xps-btn-export-json');
    if (btnJson) {
      btnJson.addEventListener('click', () => {
        const data = getCurrentTabData();
        if (!data.length) return alert('No data collected yet. Scroll the page to capture items!');
        XExporter.exportToJson(data, `epa_x_${state.activeTab}`);
      });
    }

    const btnExcel = document.getElementById('xps-btn-export-excel');
    if (btnExcel) {
      btnExcel.addEventListener('click', () => {
        const data = getCurrentTabData();
        if (!data.length) return alert('No data collected yet. Scroll the page to capture items!');
        XExporter.exportToExcel(data, `epa_x_${state.activeTab}`);
      });
    }

    const btnClear = document.getElementById('xps-btn-clear');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (!confirm(`Are you sure you want to clear collected ${state.activeTab}?`)) return;
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

  function openPreviewModal() {
    const existing = document.getElementById('xps-preview-modal');
    if (existing) existing.remove();

    const data = getCurrentTabData();
    if (!data.length) {
      alert(`No ${state.activeTab} collected yet to preview. Scroll the page or click Auto-Scroll!`);
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'xps-preview-modal';

    const headers = Object.keys(data[0]);

    modal.innerHTML = `
      <div class="xps-modal-box">
        <div class="xps-modal-header">
          <div class="xps-modal-title">Preview Collected ${state.activeTab.toUpperCase()} (${data.length} items)</div>
          <input type="text" class="xps-modal-search" placeholder="Filter rows..." id="xps-modal-filter"/>
          <button class="xps-icon-btn" id="xps-modal-close" style="font-size:18px;">✕</button>
        </div>
        <div class="xps-modal-body">
          <table class="xps-table" id="xps-preview-table">
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
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

    document.getElementById('xps-modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    const filterInput = document.getElementById('xps-modal-filter');
    filterInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = data.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(q)));
      document.getElementById('xps-preview-tbody').innerHTML = renderTableRows(filtered, headers);
    });
  }

  function renderTableRows(rows, headers) {
    if (!rows.length) return `<tr><td colspan="${headers.length}" style="text-align:center;padding:24px;">No matching rows found</td></tr>`;
    return rows.slice(0, 100).map(row => `
      <tr>
        ${headers.map(h => {
          const val = row[h];
          if (h === 'postUrl' || h === 'url') {
            return `<td><a href="${val}" target="_blank" rel="noopener">Open Link ↗</a></td>`;
          }
          if (h === 'authorAvatar' || h === 'avatar') {
            return val ? `<td><img src="${val}" class="xps-user-avatar"/></td>` : `<td>-</td>`;
          }
          const text = val !== null && val !== undefined ? String(val) : '';
          return `<td title="${text.replace(/"/g, '&quot;')}">${text}</td>`;
        }).join('')}
      </tr>
    `).join('') + (rows.length > 100 ? `<tr><td colspan="${headers.length}" style="text-align:center;color:#71767b;padding:12px;">Showing first 100 of ${rows.length} rows (all rows will be included in CSV/JSON/Excel exports)</td></tr>` : '');
  }

  function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
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

      element.style.top = Math.max(10, Math.min(window.innerHeight - element.offsetHeight - 10, newTop)) + 'px';
      element.style.left = Math.max(10, Math.min(window.innerWidth - element.offsetWidth - 10, newLeft)) + 'px';
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

    if (msg.type === 'GET_STATUS') {
      sendResponse({
        activeTab: state.activeTab,
        postsCount: state.posts.length,
        usersCount: state.users.length,
        trendsCount: state.trends.length,
        isAutoScrolling: state.isAutoScrolling
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
      const data = getCurrentTabData();
      if (!data.length) {
        sendResponse({ success: false, error: 'No data to export' });
        return true;
      }
      if (msg.format === 'csv') XExporter.exportToCsv(data, `epa_x_${state.activeTab}`);
      else if (msg.format === 'json') XExporter.exportToJson(data, `epa_x_${state.activeTab}`);
      else if (msg.format === 'excel') XExporter.exportToExcel(data, `epa_x_${state.activeTab}`);
      sendResponse({ success: true });
      return true;
    }
  });

  initUI();
  console.log('[EPA Punjab Social Listening] Content script ready and floating panel initialized.');
})();