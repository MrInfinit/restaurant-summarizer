// This script will be injected into the page.
// It will find the restaurant name and send it to the popup.

function getRestaurantName() {
  // This is just a placeholder.
  // You will need to implement a more robust way to find the restaurant name.
  let restaurantName = "";
  const title = document.querySelector('h1');
  if (title) {
    restaurantName = title.innerText;
  }
  return restaurantName;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getRestaurantName") {
    sendResponse({ restaurantName: getRestaurantName() });
  }
});
