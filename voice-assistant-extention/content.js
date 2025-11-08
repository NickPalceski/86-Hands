chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "scroll down") {
    window.scrollBy(0, window.innerHeight);
  } else if (msg.action === "scroll up") {
    window.scrollBy(0, -window.innerHeight);
  }
});
