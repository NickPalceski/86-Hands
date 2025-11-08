/*
    Anything regarding youtube content manipulation goes here
*/


chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "performSearch" && request.site.includes("youtube")) {
    searchYouTube(request.query);
  }

  if (request.action === "scrollPage") {
    scrollPage(request.command);
  }
});

function scrollPage(command) {
    const scrollAmount = 400; // Pixels PER scroll
    if (command.includes("scroll down")) {
        window.scrollBy({ top: scrollAmount, behavior: "smooth"});
    } else if (command.includes("scroll up")) {
        window.scrollBy({ top: -scrollAmount, behavior: "smooth"});
    }
}

async function searchYouTube(query) {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  chrome.tabs.create({ url: searchUrl });
}


function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
function waitFor(fn, tries = 20, delay = 500) {
  return new Promise(resolve => {
    let count = 0;
    const interval = setInterval(() => {
      if (fn()) {
        clearInterval(interval);
        resolve(true);
      } else if (++count >= tries) {
        clearInterval(interval);
        resolve(false);
      }
    }, delay);
  });
}
