chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "processCommand") {
    handleCommand(request.command.toLowerCase());
  }
});

async function handleCommand(command) {
  console.log("Processing command:", command);

  // Extract site name and query if any
  const siteMatch = command.match(/open\s+(\w+)/);
  const queryMatch = command.match(/search\s+(?:for\s+)?(.+)/);

  const site = siteMatch ? siteMatch[1] : null;
  const query = queryMatch ? queryMatch[1] : null;

  if (!site) return console.warn("No target site found in command.");

  let url = `https://${site}.com`;
  const tab = await chrome.tabs.create({ url });

  chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
    if (tabId === tab.id && info.status === "complete") {
      chrome.tabs.onUpdated.removeListener(listener);

      // Inject a site-specific or generic script
      let scriptToInject = "genericContent.js";

      if (site.includes("youtube")) {
        scriptToInject = "youtubeContent.js"; // dedicated script
      }

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [scriptToInject]
      }).then(() => {
        chrome.tabs.sendMessage(tab.id, {
          action: "performSearch",
          site,
          query
        });
      });
    }
  });
}
