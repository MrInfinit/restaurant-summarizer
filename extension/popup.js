document.getElementById("fetchBtn").addEventListener("click", () => {
  const reviewsDiv = document.getElementById("reviews");
  reviewsDiv.textContent = "Fetching...";

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // First, inject the content script to get the restaurant name
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: getRestaurantName,
    }, (injectionResults) => {
      // Error handling for injection
      if (chrome.runtime.lastError || !injectionResults || !injectionResults[0]) {
        reviewsDiv.textContent = "Error injecting script.";
        console.error(chrome.runtime.lastError);
        return;
      }

      const restaurantName = injectionResults[0].result;
      if (restaurantName) {
        // Now, send a message to the background script to fetch the summary
        chrome.runtime.sendMessage({ action: "fetchSummary", restaurantName: restaurantName }, (response) => {
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
      } else {
        reviewsDiv.textContent = "Could not find restaurant name on this page.";
      }
    });
  });
});

// This function will be injected into the active tab to find the restaurant name
function getRestaurantName() {
  // Strategy 1: If on a Google search page, get the query from the search bar
  if (window.location.hostname.includes("google.com")) {
    const searchInput = document.querySelector('textarea[name="q"], input[name="q"]');
    if (searchInput) {
      // Clean up the search query to get just the restaurant name
      return searchInput.value.replace(/reviews|best restaurants/gi, '').trim();
    }
  }

  // Strategy 2: Look for structured data (JSON-LD) - most reliable
  try {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      const data = JSON.parse(script.innerText);
      if (data['@type'] === 'Restaurant' || data['@type'] === 'LocalBusiness') {
        if (data.name) {
          return data.name;
        }
      }
    }
  } catch (e) {
    // Ignore parsing errors
  }

  // Strategy 3: Look for common H1 tags on popular sites
  const titleElement = document.querySelector('h1');
  if (titleElement) {
    return titleElement.innerText;
  }

  // Strategy 4: Fallback to the page's main title
  return document.title.split(" - ")[0];
}

