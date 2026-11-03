
(() => {
  if (window.__X_SCRAPER_INJECTED__) return;
  window.__X_SCRAPER_INJECTED__ = true;

  window.__X_SCRAPER_QUEUE__ = window.__X_SCRAPER_QUEUE__ || [];

  function emitData(url, data) {
    if (!data) return;
    try {
      const payload = { url, data, timestamp: Date.now() };
      window.__X_SCRAPER_QUEUE__.push(payload);
      
      if (window.__X_SCRAPER_QUEUE__.length > 100) {
        window.__X_SCRAPER_QUEUE__.shift();
      }
      window.dispatchEvent(new CustomEvent('__X_SCRAPER_NETWORK_DATA__', { detail: payload }));
    } catch (e) {
      
    }
  }

  function isTwitterApiUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return (
      url.includes('/graphql/') ||
      url.includes('/i/api/') ||
      url.includes('api.twitter.com') ||
      url.includes('api.x.com')
    );
  }

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    try {
      const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
      if (isTwitterApiUrl(url)) {
        const clone = response.clone();
        clone.json().then(data => {
          emitData(url, data);
        }).catch(() => {
          
        });
      }
    } catch (err) {
      
    }
    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this.__scraperUrl = typeof url === 'string' ? url : (url?.toString() || '');
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function () {
    if (isTwitterApiUrl(this.__scraperUrl)) {
      this.addEventListener('load', function () {
        try {
          if (this.responseText && this.status >= 200 && this.status < 300) {
            const data = JSON.parse(this.responseText);
            emitData(this.__scraperUrl, data);
          }
        } catch (e) {
          
        }
      });
    }
    return originalSend.apply(this, arguments);
  };

  window.addEventListener('__X_SCRAPER_REQUEST_DRAIN__', () => {
    try {
      const queue = [...window.__X_SCRAPER_QUEUE__];
      window.dispatchEvent(new CustomEvent('__X_SCRAPER_DRAIN_RESPONSE__', { detail: queue }));
    } catch (e) {}
  });

  console.log('[EPA Punjab Social Listening] Network interceptor installed in page context.');
})();