chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "processCommand") {
    handleCommand(msg.command);
  }
});

function handleCommand(command) {
  command = command.toLowerCase();
  
  // Split chained commands like "open youtube and search for cats"
  const parts = command.split(/\b(?:and|then)\b/).map(p => p.trim());
  for (const part of parts) {
    interpretCommand(part);
  }
}

function interpretCommand(cmd) {
  if (cmd.startsWith("open ")) {
    const site = cmd.replace("open ", "").trim();
    openWebsite(site);

  } else if (cmd.startsWith("search for ")) {
    const query = cmd.replace("search for ", "").trim();
    searchGoogle(query);

  } else if (cmd.includes("youtube")) {
    // e.g., "search youtube for lo-fi music"
    const match = cmd.match(/youtube.*for (.+)/);
    if (match) {
      const query = match[1].trim();
      chrome.tabs.create({ url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` });
    } else {
      chrome.tabs.create({ url: "https://www.youtube.com" });
    }

  } else if (cmd.includes("close tab")) {
    closeTab();

  } else if (cmd.includes("next tab")) {
    nextTab();

  } else if (cmd.includes("previous tab") || cmd.includes("last tab")) {
    previousTab();

  } else if (cmd.includes("refresh")) {
    refreshTab();

  } else if (cmd.includes("scroll down")) {
    sendToActiveTab({ action: "scroll down" });

  } else if (cmd.includes("scroll up")) {
    sendToActiveTab({ action: "scroll up" });
  }
}

function openWebsite(site) {
  let url = site;
  if (!site.includes(".")) {
    // Assume it's a common site name
    url = `https://www.${site}.com`;
  }
  chrome.tabs.create({ url });
}

function searchGoogle(query) {
  chrome.tabs.create({ url: `https://www.google.com/search?q=${encodeURIComponent(query)}` });
}

function closeTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) chrome.tabs.remove(tabs[0].id);
  });
}

function nextTab() {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      const activeIndex = activeTabs[0].index;
      const nextIndex = (activeIndex + 1) % tabs.length;
      chrome.tabs.update(tabs[nextIndex].id, { active: true });
    });
  });
}

function previousTab() {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      const activeIndex = activeTabs[0].index;
      const prevIndex = (activeIndex - 1 + tabs.length) % tabs.length;
      chrome.tabs.update(tabs[prevIndex].id, { active: true });
    });
  });
}

function refreshTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.reload(tabs[0].id);
  });
}

function sendToActiveTab(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) chrome.tabs.sendMessage(tabs[0].id, message);
  });
}

