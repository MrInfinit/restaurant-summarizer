chrome.runtime.onInstalled.addListener(() => {
  console.log("Review Aggregator Extension Installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchSummary") {
    const restaurantName = request.restaurantName;
    const apiUrl = `http://localhost:3000/summarize?restaurant=${encodeURIComponent(restaurantName)}`;

    // Use async function to handle the fetch promise
    (async () => {
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        sendResponse({ summary: data.summary });
      } catch (error) {
        console.error('Error fetching summary from backend:', error);
        // Send an error response back to the popup
        sendResponse({ error: "Failed to fetch summary from backend." });
      }
    })();

    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
});

