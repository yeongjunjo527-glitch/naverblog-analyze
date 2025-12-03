// background.js

// Configuration
// CHANGE THIS to your deployed Vercel URL in production
const API_BASE_URL = "http://localhost:3000"; 
const API_SECRET = "my-secure-extension-secret";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "UPLOAD_STATS") {
    console.log("Background received stats:", message.payload);
    processAndUpload(message.payload);
  }
});

async function processAndUpload(naverRawData) {
  // We need to parse the Naver specific response structure.
  // Since we don't have the exact API response documentation here, 
  // we will implement a heuristic parsers that looks for common patterns.
  
  // NOTE: This logic assumes naverRawData contains an array of daily stats 
  // or a single day object. You might need to adjust based on real inspection.
  
  let statsToUpload = [];

  try {
    // Scenario A: The response contains a list of daily stats
    // Common keys: 'data', 'result', 'dailyStats', 'visitorCount', 'date'
    
    // Recursive search for an array that looks like stats
    // Or simplified: let's try to find an object with date and count.
    
    // Example heuristic extraction:
    // If the root is an object with 'result' which is an object...
    const root = naverRawData.result || naverRawData;
    
    // Check if we can find a date and visitor count
    // Naver dates are often "YYYY-MM-DD" or "YYYYMMDD"
    
    let date = null;
    let views = 0;
    let visitors = 0;

    // Helper to normalize date to YYYY-MM-DD
    const normalizeDate = (d) => {
        if (!d) return null;
        if (d.includes('-')) return d; // Already YYYY-MM-DD
        if (d.length === 8) return `${d.substring(0,4)}-${d.substring(4,6)}-${d.substring(6,8)}`;
        return null;
    };

    if (root.statDate) date = normalizeDate(root.statDate);
    if (root.date) date = normalizeDate(root.date);
    
    if (root.pageViewCount !== undefined) views = root.pageViewCount;
    if (root.visitCount !== undefined) views = root.visitCount; // sometimes used interchangeably
    if (root.pv !== undefined) views = root.pv;

    if (root.visitorCount !== undefined) visitors = root.visitorCount;
    if (root.uv !== undefined) visitors = root.uv; // Unique Visitors

    // If we successfully extracted a single day's valid stat
    if (date && (views > 0 || visitors > 0)) {
        statsToUpload.push({ date, views, visitors, raw_data: naverRawData });
    } 
    
    // If extraction failed, log it for debugging (in real dev)
    if (statsToUpload.length === 0) {
        console.warn("Could not extract standard stats structure. Payload:", naverRawData);
        return; 
    }

    // Upload each extracted stat
    for (const stat of statsToUpload) {
        await uploadStat(stat);
    }

  } catch (e) {
    console.error("Error processing stats:", e);
  }
}

async function uploadStat(stat) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/upload-stats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-secret": API_SECRET
      },
      body: JSON.stringify(stat)
    });

    if (response.ok) {
      console.log(`Uploaded stats for ${stat.date}`);
      
      // Notify user
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png', // Ensure you have an icon.png in extension folder or remove this
        title: 'Blog Advisor',
        message: `Saved stats for ${stat.date}: ${stat.views} views`
      });
    } else {
      console.error("Upload failed:", await response.text());
    }
  } catch (error) {
    console.error("Network error:", error);
  }
}