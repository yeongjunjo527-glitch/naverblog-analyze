// 1. Inject the interceptor script into the page
const s = document.createElement('script');
s.src = chrome.runtime.getURL('inject.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

// 2. Listen for messages from the injected script
window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window) return;

  if (event.data.type && (event.data.type == "NAVER_STATS_CAPTURED")) {
    console.log("Blog Stats Captured:", event.data);
    
    // 3. Forward to Background script to handle the API upload
    chrome.runtime.sendMessage({
        type: "UPLOAD_STATS",
        payload: event.data.data // The actual JSON from Naver
    });
  }
});
