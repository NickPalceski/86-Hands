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
  await waitFor(() => document.querySelector("input#search"));
  const searchBox = document.querySelector("input#search");
  if (!searchBox) return;

  searchBox.focus();
  searchBox.value = "";

  // Human-like typing with React-compatible input events
  for (let char of query) {
    searchBox.value += char;
    searchBox.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(70 + Math.random() * 30);
  }

  const searchButton = document.querySelector(
    "#search-icon-legacy button, ytd-searchbox #search-icon-legacy"
  );
  if (searchButton) {
    searchButton.click();
  } else {
    console.warn("YouTube search button not found");
  }
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
