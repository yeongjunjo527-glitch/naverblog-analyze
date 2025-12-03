// inject.js
// This script patches network requests to capture Naver Blog statistics.

(function() {
  console.log("AI Blog Advisor: Interceptor injected");

  // Helper to safely send data to content script
  function broadcastData(url, data) {
    // Basic filter to ensure we only capture relevant stats
    // Adjust these keywords based on actual Naver API endpoints
    if (url.includes('stats') || url.includes('visitor') || url.includes('trend')) {
      window.postMessage({
        type: "NAVER_STATS_CAPTURED",
        url: url,
        data: data
      }, "*");
    }
  }

  // 1. Patch XMLHttpRequest
  const XHR = XMLHttpRequest.prototype;
  const open = XHR.open;
  const send = XHR.send;

  XHR.open = function(method, url) {
    this._method = method;
    this._url = url;
    return open.apply(this, arguments);
  };

  XHR.send = function(postData) {
    this.addEventListener('load', function() {
      if (this.responseText) {
        try {
          // Only attempt to parse if it looks like JSON
          if (this.getResponseHeader('content-type')?.includes('application/json') || 
              (this.responseText.startsWith('{') && this.responseText.endsWith('}'))) {
            const responseData = JSON.parse(this.responseText);
            broadcastData(this._url, responseData);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    });
    return send.apply(this, arguments);
  };

  // 2. Patch Fetch API
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch(...args);
    
    // Clone response to read it without consuming the stream for the original caller
    const clone = response.clone();
    
    try {
      const url = response.url;
      // Check content type
      if (response.headers.get('content-type')?.includes('application/json')) {
        clone.json().then(data => {
          broadcastData(url, data);
        }).catch(err => {});
      }
    } catch (e) {
      console.error("Fetch intercept error", e);
    }

    return response;
  };

})();