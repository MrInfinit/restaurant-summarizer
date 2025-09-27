chrome.runtime.onInstalled.addListener(() => {
  console.log("Review Aggregator Extension Installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchSummary") {
    const { restaurantName, location } = request;
    let url = `http://localhost:3000/summarize?restaurant=${encodeURIComponent(restaurantName)}`;
    if (location) {
      url += `&lat=${location.latitude}&lon=${location.longitude}`;
    }

    // Use async function to handle the fetch promise
    (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          // Try to parse the error message from the backend
          const errorData = await response.json().catch(() => null);
          const errorMessage = errorData?.error || `HTTP error! status: ${response.status}`;
          throw new Error(errorMessage);
        }
        const data = await response.json();
        sendResponse({ summary: data.summary });
      } catch (error) {
        console.error('Error fetching summary from backend:', error);
        sendResponse({ summary: `Error: ${error.message}. Is the backend server running?` });
      }
    })();

    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
});

