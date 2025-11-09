/*
any code regarding amazon content manipulation goes here
*/

// Helper function to scroll page
function scrollPage(direction, amount = 500) {
  if (direction === "down") {
    window.scrollBy({ top: amount, behavior: "smooth" });
  } else if (direction === "up") {
    window.scrollBy({ top: -amount, behavior: "smooth" });
  }
}

// Listen for commands from popup or background
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "amazonCommand") {
    const command = msg.command.toLowerCase();

    // SEARCH
    if (command.startsWith("search ")) {
      const query = command.slice(7);
      const searchBox = document.querySelector("#twotabsearchtextbox");
      const searchButton = document.querySelector("#nav-search-submit-button");

      if (searchBox) {
        searchBox.value = query;
        searchBox.dispatchEvent(new Event("input", { bubbles: true }));

        if (searchButton) {
          searchButton.click();
          sendResponse({ status: `Searching for ${query}` });
        } else {
          searchBox.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
          );
          sendResponse({ status: `Searching for ${query}` });
        }
      } else {
        sendResponse({ error: "Search box not found" });
      }
    }

    // ADD TO CART
    else if (command.includes("add to cart") || command.startsWith("add ")) {
      const addButton =
        document.querySelector("#add-to-cart-button") ||
        document.querySelector("input[name='submit.add-to-cart']");

      if (addButton) {
        addButton.click();
        sendResponse({ status: "Item added to cart" });
      } else {
        sendResponse({ error: "Add to cart button not found" });
      }
    }

    // OPEN FIRST SEARCH RESULT
    else if (command.includes("open first result")) {
      const firstResult = document.querySelector(
        "div.s-search-results a.a-link-normal.s-no-outline"
      );
      if (firstResult) {
        firstResult.click();
        sendResponse({ status: "Opening first search result" });
      } else {
        sendResponse({ error: "No search results found" });
      }
    }

    // SCROLL PAGE
    else if (command.startsWith("scroll ")) {
      if (command.includes("down")) {
        scrollPage("down");
        sendResponse({ status: "Scrolled down" });
      } else if (command.includes("up")) {
        scrollPage("up");
        sendResponse({ status: "Scrolled up" });
      } else {
        sendResponse({ error: "Unknown scroll direction" });
      }
    }

    // UNKNOWN COMMAND
    else {
      sendResponse({ error: "Unknown Amazon command" });
    }

    return true; // Indicates async response
  }
});

// -------------------------------------------------------------
// Optional helper to open Amazon in a new tab and send command
// Can be called from popup or background
function openAmazonAndRun(command) {
  chrome.tabs.create({ url: "https://www.amazon.com" }, (tab) => {
    // Wait until tab fully loads
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
      if (tabId === tab.id && changeInfo.status === "complete") {
        // Send the command to content script
        chrome.tabs.sendMessage(tab.id, { type: "amazonCommand", command });
        // Remove listener to avoid multiple triggers
        chrome.tabs.onUpdated.removeListener(listener);
      }
    });
  });
}
// Example usage:
// openAmazonAndRun("search wireless headphones");
// openAmazonAndRun("add to cart");
// scrollPage("down");
// scrollPage("up");