chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "processCommand") {
    handleCommand(msg.command);
  }
});

function handleCommand(command) {
  command = command.toLowerCase();

  if (command.includes("open youtube")) {
    chrome.tabs.create({ url: "https://www.youtube.com" });

  } else if (command.startsWith("search for")) {
    const query = command.replace("search for", "").trim();
    chrome.tabs.create({
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`
    });

  } else if (command.includes("close tab")) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.remove(tabs[0].id);
    });

  } else if (command.includes("scroll down")) {
    sendToActiveTab({ action: "scroll down" });

  } else if (command.includes("scroll up")) {
    sendToActiveTab({ action: "scroll up" });
  }
}

function sendToActiveTab(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, message);
    }
  });
}
