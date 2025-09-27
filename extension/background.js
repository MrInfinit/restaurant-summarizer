chrome.runtime.onInstalled.addListener(() => {
  console.log("ReviewFinder Extension Installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchSummary") {
    const restaurantName = request.restaurantName;
    const apiUrl = `http://localhost:3000/summarize?restaurant=${encodeURIComponent(restaurantName)}`;

    // Use fetch outside async IIFE to ensure sendResponse works
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        sendResponse({ summary: data.summary });
      })
      .catch(error => {
        console.error("Error fetching summary from backend:", error);
        sendResponse({ error: "Failed to fetch summary from backend." });
      });

    return true; //  Required to keep sendResponse alive asynchronously
  }
});

