document.addEventListener('DOMContentLoaded', function() {
  const summarizeButton = document.getElementById('summarize');
  const summaryDiv = document.getElementById('summary');

  summarizeButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getRestaurantName" }, (response) => {
        if (response && response.restaurantName) {
          // This is where you would make an API call to your backend
          // with the restaurant name to get the summary.
          // For now, we'll just display the restaurant name.
          summaryDiv.innerHTML = `Summarizing reviews for: <strong>${response.restaurantName}</strong>`;

          // Replace with your actual API call
          fetchSummary(response.restaurantName);
        } else {
          summaryDiv.innerText = "Could not find restaurant name on this page.";
        }
      });
    });
  });

  async function fetchSummary(restaurantName) {
    // Replace with your actual backend endpoint
    const apiUrl = `http://localhost:3000/summarize?restaurant=${encodeURIComponent(restaurantName)}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (data.summary) {
        summaryDiv.innerHTML = data.summary;
      } else {
        summaryDiv.innerText = "Could not get summary.";
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
      summaryDiv.innerText = "Error fetching summary.";
    }
  }
});
