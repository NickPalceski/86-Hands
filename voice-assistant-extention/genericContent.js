chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "performSearch") {
    handleSearch(request.query);
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

async function handleSearch(query) {
  await waitFor(() => document.querySelector("input[type='search'], input[type='text']"));
  const input = document.querySelector("input[type='search'], input[type='text']");
  if (!input) {
    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    return;
  }

  input.focus();
  input.value = "";
  for (let c of query) input.value += c;
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
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
