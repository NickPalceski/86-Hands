chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "processCommand") {
    handleCommand(request.command.toLowerCase());
  }
});

async function handleCommand(command) {
  console.log("Processing command:", command);

  // Tab switching
  if (command.includes("switch to next tab")){
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
            const currentIndex= activeTabs[0].index;
            const nextIndex = (currentIndex + 1) % tabs.length;
            chrome.tabs.update(tabs[nextIndex].id, { active: true });
        });
    });
    return;
  }

  if (command.includes("switch to previous tab")){
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
            const currentIndex= activeTabs[0].index;
            const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            chrome.tabs.update(tabs[prevIndex].id, { active: true });
        });
    });
    return;
  }

  // Scrolling Functionality
  if (command.includes("scroll down") || command.includes("scroll up")) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "scrollPage", command });
    });
    return;
  }

  // Searching Functionality
  const siteMatch = command.match(/open\s+(\w+)/);
  const queryMatch = command.match(/search\s+(?:for\s+)?(.+)/);

  const site = siteMatch ? siteMatch[1] : null;
  const query = queryMatch ? queryMatch[1] : null;

  if (!site) return console.warn("No target site found in command.");

  // YouTube search
  if (site.toLowerCase() === "youtube" && query) {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    await chrome.tabs.create({ url: searchUrl });
    return;
  }

  // generic sites
  let url = `https://${site}.com`;
  const tab = await chrome.tabs.create({ url });

  chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
    if (tabId === tab.id && info.status === "complete") {
      chrome.tabs.onUpdated.removeListener(listener);

      // Inject generic script for other sites
      const scriptToInject = "genericContent.js";

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [scriptToInject]
      }).then(() => {
        if (query) {
          chrome.tabs.sendMessage(tab.id, {
            action: "performSearch",
            site,
            query
          });
        }
      });
    }
  });
}
