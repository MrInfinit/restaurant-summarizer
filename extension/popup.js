document.getElementById("fetchBtn").addEventListener("click", () => {
  const reviewsDiv = document.getElementById("reviews");
  const loader = document.getElementById("loader");
  const fetchBtn = document.getElementById("fetchBtn");

  reviewsDiv.innerHTML = ""; // Clear previous content
  loader.style.display = "block"; // Show loader
  fetchBtn.disabled = true; // Disable button

  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude, longitude } = position.coords;

    // Try to get the query from the active tab first
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: getSearchQuery,
      }, (injectionResults) => {
        let restaurantName = "";
        // Check for injection errors or if no result was found
        if (chrome.runtime.lastError || !injectionResults || !injectionResults[0]?.result) {
          reviewsDiv.textContent = "Please search on Google first.";
          loader.style.display = "none"; // Hide loader
          fetchBtn.disabled = false; // Enable button
          return;
        } else {
          restaurantName = injectionResults[0].result;
        }

        if (!restaurantName) {
          reviewsDiv.textContent = "Please search on Google first.";
          loader.style.display = "none"; // Hide loader
          fetchBtn.disabled = false; // Enable button
          return;
        }

        // Send the message to the background script
        chrome.runtime.sendMessage({
          action: "fetchSummary",
          restaurantName: restaurantName,
          location: { latitude, longitude }
        }, (response) => {
          loader.style.display = "none"; // Hide loader
          fetchBtn.disabled = false; // Enable button

          if (chrome.runtime.lastError) {
            reviewsDiv.textContent = "Error fetching summary. Is the backend running?";
            console.error(chrome.runtime.lastError);
            return;
          }
          if (response && response.summary) {
            reviewsDiv.innerHTML = response.summary;
          } else {
            reviewsDiv.textContent = "Could not get summary.";
          }
        });
      });
    });
  }, (error) => {
    loader.style.display = "none"; // Hide loader
    fetchBtn.disabled = false; // Enable button
    reviewsDiv.textContent = "Could not get location. Please allow location access.";
    console.error("Geolocation error:", error);
  });
});

// This function is injected into the active tab to find the search query.
function getSearchQuery() {
  // Works for Google, Bing, DuckDuckGo, etc.
  const searchInput = document.querySelector('input[name="q"], input[name="query"], input[name="q"]');
  if (searchInput) {
    return searchInput.value.replace(/reviews|best restaurants/gi, '').trim();
  }
  return null; // Return null if no search input is found
}

