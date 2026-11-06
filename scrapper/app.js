/* Face: the accent ladder built from the EPA logo green.
   Question: how much of this search is already collected, and which tally can be exported?
   Signature: one three-cell tally. The selected count is the only full-green figure.
   No chart is drawn. Charts in styles/charts.js stays available and unused. */
(function () {
  'use strict';

  var EPA = window.EPA;
  var state = EPA.cloneSession(EPA.session);
  state.scrolling = false;
  state.filter = '';
  state.sort = 'newest';
  state.selectedId = '';
  state.flash = '';
  state.liveStatus = 'Ready';
  state.phase = new URLSearchParams(location.search).get('phase') || 'ready';
  state.focusAfter = '';

  var flashToken = 0;
  var lastRoute = '';
  var ease = 'cubic-bezier(0.23, 1, 0.32, 1)';
  var motionMs = 180;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function motion() {
    if (reduced()) return { duration: 0, easing: 'linear' };
    var style = getComputedStyle(document.documentElement);
    var raw = style.getPropertyValue('--t-ui').trim();
    var ms = parseFloat(raw);
    return {
      duration: Number.isFinite(ms) ? ms : motionMs,
      easing: style.getPropertyValue('--ease-out').trim() || ease
    };
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function route() {
    var hash = location.hash;
    if (!hash || hash === '#' || hash === '#/' || hash === '#/collected') return 'collected';
    if (hash === '#/panel' || hash === '#/preview' || hash === '#/minimized' || hash === '#/away') return hash.slice(2);
    return 'collected';
  }

  function counts() {
    if (state.phase === 'zero' || state.phase === 'empty') return { posts: 0, users: 0, trends: 0 };
    return {
      posts: state.posts.length,
      users: state.users.length,
      trends: state.trends.length
    };
  }

  function selectedCount() {
    return counts()[state.selected] || 0;
  }

  function sourceRows() {
    if (state.phase === 'zero' || state.phase === 'empty') return [];
    if (state.selected === 'users') return state.users;
    if (state.selected === 'trends') return state.trends;
    return state.posts;
  }

  function visibleRows() {
    var rows = sourceRows();
    if (state.selected === 'posts') {
      rows = EPA.filterPosts(rows, state.filter);
      rows = EPA.sortByPosted(rows, state.sort);
      return rows;
    }
    if (state.selected === 'trends') return EPA.filterTrends(rows, state.filter);
    return rows;
  }

  function shownStatus() {
    if (state.flash) return state.flash;
    if (state.scrolling) return 'Scrolling';
    return state.liveStatus;
  }

  function hintText() {
    if (state.scrolling && state.stopAt > 0) return 'Stops at ' + state.stopAt;
    if (!state.scrolling && selectedCount() === 0 && state.phase !== 'error' && state.phase !== 'loading') {
      return 'Scroll the page to collect.';
    }
    return '';
  }

  function findingText() {
    var c = counts();
    return EPA.plural(c.posts, 'post', 'posts') + ' on this search. Users still at ' + c.users + '.';
  }

  function lockup(className) {
    return '<img class="' + className + '" src="assets/epa-lockup.jpg" alt="EPA Punjab" width="240" height="240">';
  }

  function faceButton(opts) {
    var disabled = opts.disabled ? ' disabled' : '';
    var pressed = opts.pressed == null ? '' : ' aria-pressed="' + (opts.pressed ? 'true' : 'false') + '"';
    var id = opts.id ? ' id="' + opts.id + '"' : '';
    var href = opts.href ? ' href="' + esc(opts.href) + '"' : '';
    var extra = opts.attrs || '';
    var tag = opts.href ? 'a' : 'button';
    var type = opts.href ? '' : ' type="button"';
    return '<' + tag + type + id + href + ' class="hit ' + opts.kind + '"' + disabled + pressed + extra + '>' +
      '<span class="face">' + opts.label + '</span></' + tag + '>';
  }

  function autoButton() {
    var label = state.scrolling ? 'Pause' : 'Auto-scroll';
    return faceButton({
      id: 'auto',
      kind: 'primary',
      label: esc(label),
      pressed: state.scrolling,
      disabled: state.phase === 'error' || state.phase === 'loading'
    });
  }

  function scopeLine() {
    var status = shownStatus();
    var warn = status === 'Limit reached' ? ' is-warn' : '';
    var run = state.scrolling && !state.flash ? ' is-run' : '';
    return '<p class="scope"><span class="dot' + run + '" id="status-dot"></span>' +
      '<span id="page-kind">' + esc(state.pageKind) + '.</span>' +
      '<span class="status' + warn + '" id="status-text" aria-live="polite">' + esc(status) + '</span>' +
      '<span class="hint" id="status-hint">' + esc(hintText()) + '</span></p>';
  }

  function tallyCell(kind, label) {
    var c = counts();
    var n = c[kind];
    var on = state.selected === kind;
    var zero = n === 0 ? ' is-zero' : '';
    var figure = state.phase === 'loading'
      ? '<span class="bar" aria-hidden="true"></span>'
      : '<span class="cell-num num' + zero + '" id="count-' + kind + '">' + n + '</span>';
    return '<button type="button" class="cell" role="radio" id="cell-' + kind + '" data-kind="' + kind + '" aria-checked="' + (on ? 'true' : 'false') + '"' +
      (state.phase === 'loading' ? ' disabled' : '') + '>' +
      '<span class="cell-label">' + label + '</span>' + figure + '</button>';
  }

  function tallyBlock() {
    if (state.phase === 'error') {
      return '<div class="block-state" id="tally" role="alert"><p>Couldn\'t read this page. Last good at 09:14.</p>' +
        faceButton({ id: 'retry-tally', kind: 'text', label: 'Retry' }) + '</div>';
    }
    if (state.phase === 'empty') {
      return '<div class="tally" role="radiogroup" aria-label="Collected on this page" id="tally">' +
        '<div class="block-state span-all"><p>Scroll the page to collect.</p></div></div>';
    }
    return '<div class="tally" role="radiogroup" aria-label="Collected on this page" id="tally">' +
      tallyCell('posts', 'Posts') + tallyCell('users', 'Users') + tallyCell('trends', 'Trends') + '</div>';
  }

  function exportButtons() {
    var off = selectedCount() === 0 || state.phase === 'loading' || state.phase === 'error' || state.phase === 'empty' || state.phase === 'zero';
    if (state.phase === 'loading') {
      return '<span class="bar short" aria-hidden="true"></span><span class="bar short" aria-hidden="true"></span><span class="bar short" aria-hidden="true"></span>';
    }
    if (state.phase === 'error') {
      return '<div class="block-state" role="alert"><p>Couldn\'t read this page. Last good at 09:14.</p>' +
        faceButton({ id: 'retry-export', kind: 'text', label: 'Retry' }) + '</div>';
    }
    return faceButton({ id: 'csv', kind: 'quiet', label: 'CSV', disabled: off }) +
      faceButton({ id: 'json', kind: 'quiet', label: 'JSON', disabled: off }) +
      faceButton({ id: 'excel', kind: 'quiet', label: 'Excel', disabled: off });
  }

  function exportRow(withPanel) {
    var noun = state.selected;
    var label = 'Export ' + noun;
    var panel = withPanel ? '<span class="push">' + faceButton({ id: 'open-panel', kind: 'quiet', label: 'Open panel', href: '#/panel' }) + '</span>' : '';
    var emptyNote = state.phase === 'empty' ? '<p class="finding">Scroll the page to collect.</p>' : '';
    return '<div class="actions" id="export-row"><p class="export-label" id="export-label">' + esc(label) + '</p>' +
      exportButtons() + panel + '</div>' + emptyNote;
  }

  function sampleNote() {
    return '<p class="note">Sample data</p>';
  }

  function titleBlock(heading, line, withSample, actions) {
    return '<div class="head"><h1>' + esc(heading) + '</h1>' +
      (actions ? '<div class="head-actions">' + actions + '</div>' : '') +
      (line ? '<p class="finding" id="finding">' + esc(line) + '</p>' : '') +
      (withSample ? sampleNote() : '') +
      '</div>';
  }

  function collectedView() {
    return '<div class="view">' + lockup('lockup') +
      titleBlock('Collected', findingText(), true, autoButton()) +
      scopeLine() + tallyBlock() + exportRow(true) + '</div>';
  }

  function fieldSelect(id, label, options, value, extraClass) {
    var html = '<div class="field' + (extraClass ? ' ' + extraClass : '') + '"><label for="' + id + '">' + esc(label) + '</label><div class="ctl"><span class="plate"></span><select id="' + id + '">';
    options.forEach(function (opt) {
      html += '<option value="' + opt.value + '"' + (String(opt.value) === String(value) ? ' selected' : '') + '>' + esc(opt.label) + '</option>';
    });
    return html + '</select></div></div>';
  }

  function panelView() {
    var previewOff = selectedCount() === 0 || state.phase === 'empty' || state.phase === 'zero' || state.phase === 'loading' || state.phase === 'error';
    var clearOff = previewOff;
    return '<div class="view"><div class="panel-frame is-float" id="panel-frame">' +
      '<div class="panel-head" id="drag-handle"><div>' + lockup('panel-lockup') + '</div>' +
      '<div class="panel-actions">' +
      faceButton({ id: 'minimize', kind: 'icon-hit', label: iconMin(), href: '#/minimized', attrs: ' aria-label="Minimize"' }) +
      faceButton({ id: 'close-panel', kind: 'icon-hit', label: iconClose(), href: '#/collected', attrs: ' aria-label="Close"' }) +
      '</div></div>' +
      titleBlock('Collected', findingText(), true, faceButton({ id: 'preview-btn', kind: 'quiet', label: 'Preview', disabled: previewOff }) + autoButton()) +
      scopeLine() + tallyBlock() +
      '<div class="pair">' + fieldSelect('speed', 'Speed', EPA.speeds, state.speed) + fieldSelect('stop', 'Stop at', EPA.stops, state.stopAt) + '</div>' +
      exportRow(false) +
      '<div class="actions">' + faceButton({ id: 'clear-btn', kind: 'text', label: 'Clear', disabled: clearOff }) + '</div>' +
      '</div></div>';
  }

  function iconMin() {
    return '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>';
  }

  function iconClose() {
    return '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4L4 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>';
  }

  function minimizedView() {
    var c = counts();
    var n = c[state.selected];
    var noun = EPA.tallyNoun(state.selected, n);
    var numClass = n === 0 ? 'is-zero' : 'accent';
    return '<div class="view">' + titleBlock('Collected', '', true, '') +
      '<a class="pill is-docked" id="pill" href="#/panel">' +
      '<img src="assets/epa-wordmark.png" alt="" width="39" height="16">' +
      '<span><span class="' + numClass + ' num">' + n + '</span> ' + esc(noun.replace(/^\d+\s/, '')) + '</span></a></div>';
  }

  function awayView() {
    return '<div class="view">' + lockup('lockup') +
      titleBlock('Open X', 'Open a search, a profile, or Explore on X.', false,
        faceButton({ id: 'open-x', kind: 'primary', label: 'Open X', href: 'https://x.com/explore', attrs: ' rel="noopener noreferrer"' })) +
      '</div>';
  }

  function columns() {
    if (state.selected === 'trends') return EPA.trendCols;
    if (state.selected === 'users') return EPA.userCols;
    return EPA.previewCols;
  }

  function miss() {
    return '<span class="miss" role="img" aria-label="Missing"></span>';
  }

  function cellValue(row, key) {
    if (key === 'post') {
      var q = encodeURIComponent(row.text || row.name || '');
      return '<a class="hit quiet" href="https://x.com/search?q=' + q + '" rel="noopener noreferrer"><span class="face">Open</span></a>';
    }
    if (key === 'verified') return row.verified ? 'Yes' : 'No';
    var value = row[key];
    if (value == null || value === '') return miss();
    return esc(value);
  }

  function rowClass(key) {
    if (key === 'text' || key === 'name' && state.selected === 'trends') return '';
    if (key === 'likes' || key === 'rank') return 'n';
    if (key === 'reposts' || key === 'replies' || key === 'quotes' || key === 'bookmarks' || key === 'views' || key === 'followers' || key === 'following') return 'n';
    if (key === 'post') return '';
    return 'mute';
  }

  function emptyMessage(matched) {
    if (sourceRows().length === 0) return 'Scroll the page to collect.';
    if (matched === 0) return 'No rows match.';
    return '';
  }

  function tableHead() {
    return '<tr>' + columns().map(function (col) {
      var cls = col.align === 'right' ? ' class="n"' : '';
      return '<th' + cls + ' style="width:' + col.width + 'px">' + esc(col.label) + '</th>';
    }).join('') + '</tr>';
  }

  function tableRows() {
    if (state.phase === 'loading') {
      return '<tr><td colspan="' + columns().length + '"><span class="bar short" aria-hidden="true"></span></td></tr>' +
        '<tr><td colspan="' + columns().length + '"><span class="bar short" aria-hidden="true"></span></td></tr>' +
        '<tr><td colspan="' + columns().length + '"><span class="bar short" aria-hidden="true"></span></td></tr>';
    }
    if (state.phase === 'error') {
      return '<tr><td colspan="' + columns().length + '"><div class="block-state" role="alert"><p>Couldn\'t read this page. Last good at 09:14.</p>' +
        faceButton({ id: 'retry-preview', kind: 'text', label: 'Retry' }) + '</div></td></tr>';
    }
    var rows = visibleRows();
    var message = emptyMessage(rows.length);
    if (message) {
      return '<tr class="empty-row"><td colspan="' + columns().length + '">' + esc(message) + '</td></tr>';
    }
    return rows.map(function (row) {
      var selected = row.id === state.selectedId ? ' aria-selected="true"' : ' aria-selected="false"';
      return '<tr tabindex="0" data-id="' + esc(row.id) + '"' + selected + '>' + columns().map(function (col) {
        var cls = rowClass(col.key);
        return '<td' + (cls ? ' class="' + cls + '"' : '') + '>' + cellValue(row, col.key) + '</td>';
      }).join('') + '</tr>';
    }).join('');
  }

  function phoneRows() {
    if (state.phase === 'loading') {
      return '<div class="phone-row"><span class="bar short" aria-hidden="true"></span></div>';
    }
    if (state.phase === 'error') {
      return '<div class="block-state" role="alert"><p>Couldn\'t read this page. Last good at 09:14.</p>' +
        faceButton({ id: 'retry-phone', kind: 'text', label: 'Retry' }) + '</div>';
    }
    var rows = visibleRows();
    var message = emptyMessage(rows.length);
    if (message) return '<p class="finding" id="empty-line">' + esc(message) + '</p>';
    return rows.map(function (row) {
      if (state.selected === 'trends') {
        var context = row.context == null ? miss() : esc(row.context);
        var detail = row.detail == null ? miss() : esc(row.detail);
        return '<article class="phone-row" data-id="' + esc(row.id) + '"><p class="phone-id">' + esc(row.name) + '</p>' +
          '<p class="phone-key num">' + row.rank + '</p><p class="phone-sub">' + context + ' · ' + detail + '</p></article>';
      }
      var bits = [row.name, '@' + row.username, row.posted, 'Reposts ' + row.reposts, 'Replies ' + row.replies, 'Quotes ' + row.quotes, 'Bookmarks ' + row.bookmarks, row.views == null ? '' : ('Views ' + row.views), row.type, row.verified ? 'Yes' : 'No', row.id].filter(Boolean);
      var q = encodeURIComponent(row.text || '');
      return '<article class="phone-row" data-id="' + esc(row.id) + '"><p class="phone-id">' + esc(row.text) + '</p>' +
        '<div class="phone-side"><p class="phone-key num">' + row.likes + '</p>' +
        '<a class="hit quiet" href="https://x.com/search?q=' + q + '" rel="noopener noreferrer"><span class="face">Open</span></a></div>' +
        '<p class="phone-sub">' + esc(bits.join(' · ')) + '</p></article>';
    }).join('');
  }

  function matchLabel() {
    var rows = state.phase === 'zero' || state.phase === 'empty' ? [] : visibleRows();
    if (state.phase === 'zero' || state.phase === 'empty') {
      return EPA.tallyNoun(state.selected, 0);
    }
    return EPA.tallyNoun(state.selected, rows.length);
  }

  function previewView() {
    var line = EPA.tallyNoun(state.selected, selectedCount()) + '. Export includes every row.';
    var sortField = state.selected === 'posts'
      ? fieldSelect('sort', 'Sort', [{ value: 'newest', label: 'Posted, newest' }, { value: 'oldest', label: 'Posted, oldest' }], state.sort, 'sort-field')
      : '';
    var body = state.phase === 'error'
      ? '<div class="block-state" role="alert"><p>Couldn\'t read this page. Last good at 09:14.</p>' + faceButton({ id: 'retry-preview', kind: 'text', label: 'Retry' }) + '</div>'
      : '<div class="table-scroll"><table class="rows"><thead>' + tableHead() + '</thead><tbody id="preview-body">' + tableRows() + '</tbody></table></div>' +
        '<div class="phone-list" id="phone-list">' + phoneRows() + '</div>';
    return '<div class="view" role="dialog" aria-modal="true" aria-labelledby="preview-title">' +
      titleBlock('Preview', line, true, faceButton({ id: 'close-preview', kind: 'quiet', label: 'Close', href: '#/panel' })) +
      '<div class="toolbar"><div class="field filter-field"><label for="filter">Filter</label><div class="ctl"><span class="plate"></span>' +
      '<input id="filter" type="text" value="' + esc(state.filter) + '" autocomplete="off"></div></div>' +
      '<div class="toolbar-end"><p class="count-live num" id="match-count">' + esc(matchLabel()) + '</p>' + sortField + '</div></div>' +
      body + '</div>';
  }

  var views = {
    collected: collectedView,
    panel: panelView,
    preview: previewView,
    minimized: minimizedView,
    away: awayView
  };

  function markNav(name) {
    document.querySelectorAll('.views a').forEach(function (link) {
      if (link.getAttribute('data-route') === name) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function bindImages() {
    document.querySelectorAll('#view img').forEach(function (img) {
      img.addEventListener('error', function () {
        if (!img.classList.contains('lockup') && !img.classList.contains('panel-lockup')) return;
        var p = document.createElement('p');
        p.className = 'lockup-fallback';
        p.textContent = 'EPA Punjab';
        img.replaceWith(p);
      });
    });
  }

  function bindDrag() {
    var handle = document.getElementById('drag-handle');
    var frame = document.getElementById('panel-frame');
    if (!handle || !frame) return;
    handle.addEventListener('pointerdown', function (event) {
      if (event.target.closest('button, a, input, select')) return;
      if (!window.matchMedia('(min-width: 641px) and (max-width: 1100px)').matches) return;
      event.preventDefault();
      var rect = frame.getBoundingClientRect();
      var startX = event.clientX;
      var startY = event.clientY;
      frame.style.position = 'fixed';
      frame.style.left = rect.left + 'px';
      frame.style.top = rect.top + 'px';
      frame.style.right = 'auto';
      frame.style.bottom = 'auto';
      frame.style.margin = '0';
      function move(ev) {
        var left = rect.left + (ev.clientX - startX);
        var top = rect.top + (ev.clientY - startY);
        var min = 24;
        left = Math.max(min - frame.offsetWidth, Math.min(window.innerWidth - min, left));
        top = Math.max(min - handle.offsetHeight, Math.min(window.innerHeight - min, top));
        frame.style.left = left + 'px';
        frame.style.top = top + 'px';
      }
      function up() {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', up);
      }
      handle.setPointerCapture(event.pointerId);
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
    });
  }

  function render(opts) {
    opts = opts || {};
    var name = route();
    var fade = opts.fade !== false && lastRoute && lastRoute !== name;
    lastRoute = name;
    var root = document.getElementById('view');
    root.classList.remove('is-fade');
    root.innerHTML = views[name]();
    var heading = root.querySelector('h1');
    if (heading) document.title = heading.textContent;
    markNav(name);
    bindImages();
    bindDrag();
    if (fade && !reduced()) {
      root.classList.add('is-fade');
    }
    var focusId = opts.focus || state.focusAfter;
    state.focusAfter = '';
    if (focusId) {
      var el = document.getElementById(focusId);
      if (el) el.focus();
    }
  }

  function paintPreview() {
    var body = document.getElementById('preview-body');
    var phone = document.getElementById('phone-list');
    var count = document.getElementById('match-count');
    if (body) body.innerHTML = tableRows();
    if (phone) phone.innerHTML = phoneRows();
    if (count) count.textContent = matchLabel();
    var target = body || phone;
    if (!target || reduced()) return;
    var m = motion();
    if (!m.duration) return;
    target.getAnimations().forEach(function (anim) { anim.cancel(); });
    target.animate([{ opacity: 0.45 }, { opacity: 1 }], m);
  }

  function choose(kind, focus) {
    if (state.phase === 'loading') return;
    state.selected = kind;
    state.selectedId = '';
    render({ fade: false, focus: focus || ('cell-' + kind) });
  }

  function toggleScroll() {
    if (state.phase === 'error' || state.phase === 'loading') return;
    var count = selectedCount();
    if (!state.scrolling && state.stopAt > 0 && count >= state.stopAt) {
      state.scrolling = false;
      state.liveStatus = 'Limit reached';
      state.flash = '';
      render({ fade: false, focus: 'auto' });
      return;
    }
    state.scrolling = !state.scrolling;
    if (state.scrolling) state.liveStatus = 'Ready';
    else if (state.liveStatus === 'Limit reached') state.liveStatus = 'Ready';
    state.flash = '';
    render({ fade: false, focus: 'auto' });
  }

  function recordsForExport() {
    if (state.selected === 'trends') {
      return state.trends.map(function (row) {
        return { name: row.name, rank: row.rank, context: row.context, detail: row.detail };
      });
    }
    if (state.selected === 'users') return state.users.slice();
    return state.posts.map(function (row) {
      return {
        id: row.id,
        type: row.type,
        text: row.text,
        posted: row.posted,
        language: null,
        likes: row.likes,
        reposts: row.reposts,
        replies: row.replies,
        quotes: row.quotes,
        bookmarks: row.bookmarks,
        views: row.views,
        name: row.name,
        username: row.username,
        followers: null,
        following: null,
        bio: null,
        verified: row.verified,
        photo: null,
        banner: null,
        media: null
      };
    });
  }

  function download(filename, blob) {
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
  }

  function toCsv(rows) {
    if (!rows.length) return '';
    var keys = Object.keys(rows[0]);
    function cell(value) {
      var text = value == null ? '' : String(value);
      if (/[",\n]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
      return text;
    }
    return [keys.join(',')].concat(rows.map(function (row) {
      return keys.map(function (key) { return cell(row[key]); }).join(',');
    })).join('\r\n');
  }

  function toExcel(rows) {
    var keys = rows.length ? Object.keys(rows[0]) : [];
    var head = '<tr>' + keys.map(function (key) { return '<th>' + esc(key) + '</th>'; }).join('') + '</tr>';
    var body = rows.map(function (row) {
      return '<tr>' + keys.map(function (key) { return '<td>' + esc(row[key] == null ? '' : row[key]) + '</td>'; }).join('') + '</tr>';
    }).join('');
    return '<html><head><meta charset="utf-8"></head><body><table>' + head + body + '</table></body></html>';
  }

  function flashStatus(text, focus) {
    state.flash = text;
    var token = ++flashToken;
    render({ fade: false, focus: focus });
    setTimeout(function () {
      if (token !== flashToken) return;
      state.flash = '';
      render({ fade: false, focus: focus });
    }, motion().duration ? 1600 : 1600);
  }

  function exportAs(format) {
    if (selectedCount() === 0) return;
    var rows = recordsForExport();
    var base = 'epa_x_' + state.selected;
    if (format === 'json') {
      download(base + '.json', new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }));
      flashStatus('Saved JSON', 'json');
      return;
    }
    if (format === 'excel') {
      download(base + '.xls', new Blob([toExcel(rows)], { type: 'application/vnd.ms-excel' }));
      flashStatus('Saved Excel', 'excel');
      return;
    }
    download(base + '.csv', new Blob([toCsv(rows)], { type: 'text/csv' }));
    flashStatus('Saved CSV', 'csv');
  }

  function applyClear() {
    if (state.selected === 'posts') state.posts = [];
    else if (state.selected === 'users') state.users = [];
    else state.trends = [];
    state.scrolling = false;
    state.liveStatus = 'Ready';
    state.flash = '';
  }

  function openConfirm() {
    if (selectedCount() === 0) return;
    var label = EPA.tallyNoun(state.selected, selectedCount());
    var dialog = document.createElement('dialog');
    dialog.className = 'confirm';
    dialog.innerHTML = '<p>Clear ' + esc(label) + '?</p><div class="actions">' +
      faceButton({ id: 'confirm-cancel', kind: 'quiet', label: 'Cancel' }) +
      faceButton({ id: 'confirm-clear', kind: 'text', label: 'Clear' }) + '</div>';
    document.body.appendChild(dialog);
    dialog.showModal();
    function finish(ok) {
      if (dialog.open) dialog.close();
      dialog.remove();
      if (ok) applyClear();
      render({ fade: false, focus: 'clear-btn' });
    }
    dialog.querySelector('#confirm-cancel').addEventListener('click', function () { finish(false); });
    dialog.querySelector('#confirm-clear').addEventListener('click', function () { finish(true); });
    dialog.addEventListener('cancel', function (event) {
      event.preventDefault();
      finish(false);
    });
  }

  function retry() {
    state.phase = 'ready';
    var url = new URL(location.href);
    url.searchParams.delete('phase');
    history.replaceState(null, '', url.pathname + url.search + location.hash);
    render({ fade: false, focus: 'auto' });
  }

  function onClick(event) {
    var retryBtn = event.target.closest('[id^="retry-"]');
    if (retryBtn) {
      retry();
      return;
    }
    var cell = event.target.closest('.cell');
    if (cell && !cell.disabled) {
      choose(cell.getAttribute('data-kind'), cell.id);
      return;
    }
    if (event.target.closest('#auto')) {
      toggleScroll();
      return;
    }
    if (event.target.closest('#preview-btn')) {
      if (selectedCount() === 0) return;
      location.hash = '#/preview';
      return;
    }
    if (event.target.closest('#close-preview')) state.focusAfter = 'preview-btn';
    if (event.target.closest('#csv')) exportAs('csv');
    if (event.target.closest('#json')) exportAs('json');
    if (event.target.closest('#excel')) exportAs('excel');
    if (event.target.closest('#clear-btn')) openConfirm();
    var row = event.target.closest('tr[data-id]');
    if (row && !event.target.closest('a')) {
      state.selectedId = row.getAttribute('data-id');
      document.querySelectorAll('#preview-body tr').forEach(function (tr) {
        tr.setAttribute('aria-selected', tr === row ? 'true' : 'false');
      });
    }
  }

  function onInput(event) {
    if (event.target.id !== 'filter') return;
    state.filter = event.target.value;
    paintPreview();
  }

  function onChange(event) {
    if (event.target.id === 'speed') {
      state.speed = Number(event.target.value);
      return;
    }
    if (event.target.id === 'stop') {
      state.stopAt = Number(event.target.value);
      render({ fade: false, focus: 'stop' });
      return;
    }
    if (event.target.id === 'sort') {
      state.sort = event.target.value;
      paintPreview();
    }
  }

  function onKey(event) {
    var cell = event.target.closest && event.target.closest('.cell');
    if (cell && (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      var order = ['posts', 'users', 'trends'];
      var index = order.indexOf(state.selected);
      var step = (event.key === 'ArrowRight' || event.key === 'ArrowDown') ? 1 : -1;
      var next = order[(index + step + order.length) % order.length];
      choose(next, 'cell-' + next);
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches && event.target.matches('tr[data-id]')) {
      event.preventDefault();
      state.selectedId = event.target.getAttribute('data-id');
      event.target.setAttribute('aria-selected', 'true');
    }
  }

  document.getElementById('view').addEventListener('click', onClick);
  document.getElementById('view').addEventListener('input', onInput);
  document.getElementById('view').addEventListener('change', onChange);
  document.getElementById('view').addEventListener('keydown', onKey);

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' && event.key !== 'Tab') return;
    var dialog = document.querySelector('dialog.confirm');
    if (dialog && dialog.open) return;
    if (event.key === 'Escape' && route() === 'preview') {
      event.preventDefault();
      state.focusAfter = 'preview-btn';
      location.hash = '#/panel';
      return;
    }
    if (event.key !== 'Tab' || route() !== 'preview') return;
    var root = document.getElementById('view');
    var items = Array.prototype.filter.call(root.querySelectorAll('a, button, input, select, textarea, tr[tabindex="0"]'), function (el) {
      return !el.disabled && el.offsetParent !== null;
    });
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener('hashchange', function () {
    render({ fade: true });
  });

  render({ fade: false });

  window.EPA_UI = {
    state: state,
    counts: counts,
    visibleRows: visibleRows,
    render: render,
    toggleScroll: toggleScroll
  };

  if (new URLSearchParams(location.search).get('selftest') === '1') {
    window.addEventListener('load', function () {
      setTimeout(runSelfTest, 30);
    });
  }

  function textOf(id) {
    var el = document.getElementById(id);
    return el ? el.textContent.trim() : '';
  }

  function hitFailures() {
    var bad = [];
    document.querySelectorAll('button, a, input, select, summary').forEach(function (el) {
      if (el.offsetParent === null && el.tagName !== 'BODY') {
        var hidden = el.closest('.phone-list, .table-scroll');
        if (hidden && getComputedStyle(hidden).display === 'none') return;
      }
      var rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      if (rect.width < 44 || rect.height < 44) {
        bad.push((el.id || el.textContent || el.tagName).trim().slice(0, 40) + ' ' + Math.round(rect.width) + 'x' + Math.round(rect.height));
      }
    });
    return bad;
  }

  async function runSelfTest() {
    var lines = [];
    function note(ok, msg) {
      lines.push((ok ? 'ok' : 'FAIL') + ' ' + msg);
    }
    await document.fonts.ready;
    var faces = [];
    document.fonts.forEach(function (face) { faces.push(face.family + ' ' + face.status + ' ' + face.weight); });
    note(document.fonts.check('16px "DM Sans"'), 'fonts.check 16px DM Sans; faces: ' + faces.join(' | '));
    note(document.fonts.check('700 32px "DM Sans"'), 'fonts.check 700 32px DM Sans');
    note(!EPA.failures.length, 'session asserts ' + (EPA.failures.join('; ') || 'passed'));
    note(document.querySelectorAll('h1').length === 1, 'one h1 on collected');
    var autoBox = document.getElementById('auto').getBoundingClientRect();
    var excelBox = document.getElementById('excel').getBoundingClientRect();
    var viewW = window.innerWidth;
    function edge(sel) {
      var el = document.querySelector(sel);
      if (!el) return sel + ' missing';
      var r = el.getBoundingClientRect();
      return sel + ' ' + Math.round(r.left) + '-' + Math.round(r.right) + ' sw' + el.scrollWidth;
    }
    note(autoBox.left >= 0 && autoBox.right <= viewW + 1 && autoBox.width >= 44, 'auto in view ' + Math.round(autoBox.left) + '-' + Math.round(autoBox.right) + ' w ' + Math.round(autoBox.width) + ' inner ' + viewW + ' client ' + document.documentElement.clientWidth);
    note(excelBox.left >= 0 && excelBox.right <= viewW + 1 && excelBox.width >= 44, 'excel in view ' + Math.round(excelBox.left) + '-' + Math.round(excelBox.right) + ' w ' + Math.round(excelBox.width));
    note(true, edge('.canvas') + ' | ' + edge('.head') + ' | ' + edge('.head-actions') + ' | ' + edge('#export-row') + ' | ' + edge('nav.views'));
    note(textOf('finding') === '6 posts on this search. Users still at 0.', 'finding ' + textOf('finding'));
    note(document.querySelectorAll('#view .note').length === 1, 'one sample note');
    note(textOf('count-posts') === '6' && textOf('count-users') === '0' && textOf('count-trends') === '2', 'tally 6 0 2');
    note(document.body.innerText.indexOf('11 trends') === -1, 'rank sum is not the tally');

    document.getElementById('cell-users').click();
    note(document.getElementById('csv').disabled, 'export disabled at 0 users');
    note(textOf('export-label') === 'Export users', 'export users label');
    note(textOf('status-hint').indexOf('Scroll the page to collect') !== -1, 'zero hint');
    document.getElementById('cell-posts').click();

    document.getElementById('auto').click();
    note(textOf('status-text') === 'Scrolling' && document.getElementById('auto').getAttribute('aria-pressed') === 'true', 'scrolling toggles');
    note(textOf('count-posts') === '6', 'scroll does not add rows');
    document.getElementById('auto').click();
    note(textOf('status-text') === 'Ready', 'pause restores Ready');

    state.stopAt = 5;
    toggleScroll();
    note(textOf('status-text') === 'Limit reached' && document.getElementById('auto').getAttribute('aria-pressed') === 'false', 'limit reached at 5');
    state.stopAt = 0;
    state.liveStatus = 'Ready';
    render({ fade: false });

    location.hash = '#/preview';
    await wait(40);
    var filter = document.getElementById('filter');
    filter.value = 'orchard';
    filter.dispatchEvent(new Event('input', { bubbles: true }));
    note(document.querySelectorAll('#preview-body tr[data-id]').length === 1, 'orchard shows 1');
    note(textOf('match-count') === '1 post', 'filtered count ' + textOf('match-count'));
    note(textOf('finding').indexOf('6 posts') === 0, 'export line stays 6');
    filter.value = 'zzzz';
    filter.dispatchEvent(new Event('input', { bubbles: true }));
    note(document.body.innerText.indexOf('No rows match.') !== -1, 'zzzz empty line');
    filter.value = 'canal';
    filter.dispatchEvent(new Event('input', { bubbles: true }));
    note(document.querySelectorAll('#preview-body tr[data-id]').length === 2, 'canal shows 2');
    filter.value = '';
    filter.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('sort').value = 'oldest';
    document.getElementById('sort').dispatchEvent(new Event('change', { bubbles: true }));
    var first = document.querySelector('#preview-body tr[data-id]');
    note(first && first.getAttribute('data-id') === 's-06', 'oldest starts at s-06');
    note(document.querySelectorAll('h1').length === 1, 'one h1 on preview');
    var sortBox = document.getElementById('sort').getBoundingClientRect();
    var sideways = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    var wide = [];
    if (sideways > 1) {
      document.querySelectorAll('body *').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.right > window.innerWidth + 1 && r.width > 0 && r.height > 0) {
          wide.push(((el.id || el.className || el.tagName) + '').replace(/\s+/g, '.').slice(0, 36) + '@' + Math.round(r.right));
        }
      });
    }
    note(sideways <= 1, 'preview stays inside the window by ' + sideways + (wide.length ? ' ' + wide.slice(0, 10).join('; ') : ''));
    var sub = document.querySelector('.phone-sub');
    var subBox = sub ? sub.getBoundingClientRect() : { left: 0, right: 0, width: 0 };
    var canvasR = Math.round(document.querySelector('.canvas').getBoundingClientRect().right);
    var viewR = Math.round(document.querySelector('.view').getBoundingClientRect().right);
    var toolR = Math.round(document.querySelector('.toolbar').getBoundingClientRect().right);
    note(sortBox.width >= 160 && sortBox.right <= document.documentElement.clientWidth - 24, 'sort width ' + Math.round(sortBox.width) + ' right ' + Math.round(sortBox.right) + ' canvas ' + canvasR + ' view ' + viewR + ' toolbar ' + toolR + ' client ' + document.documentElement.clientWidth);
    note(!sub || subBox.right <= viewW + 1, 'sub right ' + Math.round(subBox.right) + ' w ' + Math.round(subBox.width));

    location.hash = '#/away';
    await wait(40);
    note(document.querySelectorAll('h1').length === 1 && textOf('view') && document.querySelector('h1').textContent === 'Open X', 'away h1');
    note(!document.querySelector('#view .note'), 'away has no sample line');

    location.hash = '#/minimized';
    await wait(40);
    note(document.querySelector('h1').textContent === 'Collected', 'minimized h1');
    note(document.querySelectorAll('#view .note').length === 1, 'minimized sample once');

    location.hash = '#/panel';
    await wait(40);
    note(document.querySelectorAll('h1').length === 1, 'panel one h1');
    note(document.querySelectorAll('#view .note').length === 1, 'panel sample once');
    var bad = hitFailures();
    note(!bad.length, 'hit targets ' + (bad.join('; ') || 'all at least 44'));
    note(document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1, 'panel stays inside the window');

    var pre = document.createElement('pre');
    pre.id = 'selftest';
    pre.textContent = lines.join('\n');
    document.body.appendChild(pre);
  }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }
})();
