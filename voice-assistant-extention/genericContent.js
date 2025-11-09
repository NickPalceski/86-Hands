// Listen for background script requests to perform site searches.
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "performSearch") {
    handleSearch(request.site, request.query).catch(err => console.error('performSearch error', err));
  }
});

async function handleSearch(site, query) {
  // Normalize site token if present
  if (site) {
    site = site.toString().trim().toLowerCase();
    site = site.replace(/^www\./, '');
    site = site.replace(/\.(com|org|net|io|co|gov|edu|us|uk)$/, '');
  }

  // If we know how to build a direct search URL, prefer that — it's more reliable than DOM injection
  const directMap = {
    youtube: q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
    amazon: q => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`,
    google: q => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
    duckduckgo: q => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
    reddit: q => `https://www.reddit.com/search/?q=${encodeURIComponent(q)}`,
    twitter: q => `https://twitter.com/search?q=${encodeURIComponent(q)}`,
    x: q => `https://twitter.com/search?q=${encodeURIComponent(q)}`,
    wikipedia: q => `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}`,
    spotify: q => `https://open.spotify.com/search/${encodeURIComponent(q)}`,
    vimeo: q => `https://vimeo.com/search?q=${encodeURIComponent(q)}`
  };

  if (site && directMap[site]) {
    window.location.href = directMap[site](query);
    return;
  }

  // If no site provided, default to Google search
  if (!site && query) {
    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    return;
  }

  // Try site-specific input selectors for a better DOM-targeted search. These are tried before generic input lookup.
  const selectorMap = {
    youtube: "input#search",
    amazon: "input#twotabsearchtextbox",
    google: "input[name='q']",
    duckduckgo: "input[name='q']",
    reddit: "input[type='search']",
    wikipedia: "input#searchInput",
    spotify: "input[placeholder='Search']",
    vimeo: "input[type='search']"
  };

  const trySelector = selectorMap[site];
  if (trySelector) {
    const ok = await fillAndSubmitInput(trySelector, query);
    if (ok) return;
  }

  // Fallback: attempt to find any reasonable text/search input on the page and submit
  const genericSelectors = [
    "input[type='search']",
    "input[type='text']",
    "input[name='q']",
    "input[placeholder*='Search']",
    "input[role='search']"
  ];

  for (const sel of genericSelectors) {
    const ok = await fillAndSubmitInput(sel, query);
    if (ok) return;
  }

  // If we still haven't handled it, open the site homepage (if site present) and try again once it loads
  if (site) {
    const url = site.match(/^https?:\/\//) ? site : `https://${site}.com`;
    try {
      window.location.href = url;
    } catch (e) {
      console.error('Could not navigate to site:', e);
    }
    // Let the background script handle injecting this content script after navigation if needed.
  } else {
    // Last resort: Google search
    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }
}

// Fill an input matching `selector` and attempt to submit it.
async function fillAndSubmitInput(selector, query, tries = 20, delay = 300) {
  const found = await waitFor(() => document.querySelector(selector), tries, delay);
  if (!found) return false;

  const input = document.querySelector(selector);
  if (!input) return false;

  try {
    input.focus();
    // set value safely
    input.value = query;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // If the input is inside a form, submit it
    const form = input.form || input.closest('form');
    if (form) {
      // attempt to find a submit button first
      const submitBtn = form.querySelector("button[type='submit'], input[type='submit']");
      if (submitBtn) {
        submitBtn.click();
        return true;
      }
      form.submit();
      return true;
    }

    // Otherwise, try to find and click a nearby submit button
    const btn = document.querySelector("button[type='submit'], input[type='submit']");
    if (btn) {
      btn.click();
      return true;
    }

    // Fallback: dispatch Enter key events on the input
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    return true;
  } catch (e) {
    console.error('fillAndSubmitInput error', e);
    return false;
  }
}

function waitFor(fn, tries = 20, delay = 500) {
  return new Promise(resolve => {
    let count = 0;
    const interval = setInterval(() => {
      try {
        if (fn()) {
          clearInterval(interval);
          resolve(true);
        } else if (++count >= tries) {
          clearInterval(interval);
          resolve(false);
        }
      } catch (e) {
        clearInterval(interval);
        resolve(false);
      }
    }, delay);
  });
}
