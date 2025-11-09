// Import Gemini API files
import { fetchCommand } from './api-handler.js';


// ------------------------------------------------------------------------------------------------------------------------------
// MESSAGING/COMMUNICATION HANDLER
// ------------------------------------------------------------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle Toggling (from popup.js)
    if (typeof message.serviceEnabled !== 'undefined') {
        
        // Query for the currently active tab in the focused window
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0 && tabs[0].url && tabs[0].url.startsWith('http')) {
                const activeTabId = tabs[0].id;

                const serviceStateMessage = { serviceEnabled: message.serviceEnabled };

                // Wait briefly before sending the message to give content.js time to load
                setTimeout(() => {
                    // Use callback form and check chrome.runtime.lastError to avoid unhandled promise rejections
                    chrome.tabs.sendMessage(activeTabId, serviceStateMessage, (response) => {
                        if (chrome.runtime.lastError) {
                            console.warn(`[IGNORED WARNING] Message failed (likely timing/special page): ${chrome.runtime.lastError.message}`);
                        } else {
                            // Message delivered successfully (response may be undefined)
                            // console.log(`Message delivered to tab ${activeTabId}`);
                        }
                    });
                }, 400); // Wait 400ms
            } else {
                console.warn("Cannot activate speech recognition: No active, valid web page found.");
            }
        });
    }
    // Handle processing a user command sent from the content script
    else if (message && message.action === 'processCommand' && typeof message.speechText === 'string') {
        // Fire-and-forget: process the raw speech text via handleSpeech
        handleSpeech(message.speechText).catch(err => console.error('Error handling speech:', err));
    }
  });

// ------------------------------------------------------------------------------------------------------------------------------
// SPEECH PARSING VIA AI 
// ------------------------------------------------------------------------------------------------------------------------------

// User speech intro function, prepares and send to AI for review
async function handleSpeech(text) {

  console.log("Service Worker: Received speech for processing:", text);
  const parsedCommand = await fetchCommand(text); // Gemini's result

  console.log("Gemini has returned:", parsedCommand); // AI result
    executeCommand(parsedCommand); // Executes based on user command + AI parsing

}


// ------------------------------------------------------------------------------------------------------------------------------
// STEP 5: COMMAND EXECUTION
// ------------------------------------------------------------------------------------------------------------------------------

function executeCommand(parsedCommand) {
    // If AI returned multiple options or a markdown list, try to extract the most-likely command
    function extractBestCommand(text) {
        if (!text || typeof text !== 'string') return text;
        const siteKeywords = ['youtube','yt','amazon','google','reddit','twitter','x','wikipedia','spotify','vimeo','search','open','url'];

        // 1) Prefer text inside backticks (code-like suggestions)
        const codeRe = /`([^`]+)`/g;
        const codes = [];
        let m;
        while ((m = codeRe.exec(text)) !== null) codes.push(m[1]);
        if (codes.length) {
            // prefer a candidate that mentions a known site or 'search' or 'open' or 'http'
            for (const c of codes) {
                const lc = c.toLowerCase();
                if (siteKeywords.some(k => lc.includes(k) || lc.includes(k + ' '))) return c;
                if (/https?:\/\//i.test(c)) return c;
            }
            return codes[0];
        }

        // 2) Otherwise split lines / bullets and pick the first line that contains a site keyword
        const lines = text.split(/\r?\n/).map(l => l.replace(/^[\s\-\*\d\.\)]+/, '').trim()).filter(Boolean);
        for (const line of lines) {
            const lc = line.toLowerCase();
            if (siteKeywords.some(k => lc.includes(k))) {
                // extract backtick if present in the line
                const b = line.match(/`([^`]+)`/);
                if (b) return b[1];
                return line;
            }
        }

        // 3) Fallback: return the first non-empty line or the original text
        return lines.length ? lines[0] : text.trim();
    }

    parsedCommand = extractBestCommand(parsedCommand);
    const command = parsedCommand.toLowerCase().trim();

    console.log(`SW: Executing command: ${command}`);

    // Quick path: if AI returned a literal URL (e.g. "Open URL: https://..."), open it directly
    const urlMatch = parsedCommand.match(/https?:\/\/[^\s`]+/i);
    if (urlMatch) {
        const url = urlMatch[0].replace(/`/g, '');
        chrome.tabs.create({ url });
        console.log(`Executed: Opened direct URL from AI: ${url}`);
        return;
    }

        // Normalize common AI output formats (camelCase, punctuation, underscores)
        // so matching using human phrases (e.g. "close tab") works reliably.
        let normalized = parsedCommand
            // insert spaces before camelCase boundaries
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            // replace non-letters with spaces
            .replace(/[^a-zA-Z ]+/g, ' ')
            // collapse whitespace
            .replace(/\s+/g, ' ')
            .toLowerCase()
            .trim();

        console.log(`SW: Normalized command: ${normalized}`);

    if (normalized.includes("close current tab") || normalized.includes("close this tab") || normalized.includes("close tab") || (normalized.includes('close') && normalized.includes('tab'))) {
        chrome.windows.getCurrent({ populate: true }, (window) => {
            if (!window || !window.tabs) return;
            const activeTab = window.tabs.find(t => t.active);
            if (!activeTab) return;
            chrome.tabs.remove(activeTab.id);
            console.log("Executed: Close current tab.");
        });
    } 

    if (normalized.includes("switch to next tab") || normalized.includes('next tab') || normalized.includes('switch next')) {
        chrome.windows.getCurrent({ populate: true }, (window) => {
            if (!window || !window.tabs) return;
            const activeTab = window.tabs.find(t => t.active);
            if (!activeTab) return;
            const currentIndex = activeTab.index;
            const nextIndex = (currentIndex + 1) % window.tabs.length;
            chrome.tabs.update(window.tabs[nextIndex].id, { active: true });
        });
        return;
    }

    if (normalized.includes("switch to previous tab") || normalized.includes('previous tab') || normalized.includes('switch previous') || normalized.includes('prev tab')) {
        chrome.windows.getCurrent({ populate: true }, (window) => {
            if (!window || !window.tabs) return;
            const activeTab = window.tabs.find(t => t.active);
            if (!activeTab) return;
            const currentIndex = activeTab.index;
            const prevIndex = (currentIndex - 1 + window.tabs.length) % window.tabs.length;
            chrome.tabs.update(window.tabs[prevIndex].id, { active: true });
        });
        return;
    }

    if (normalized.includes("scroll down") || normalized.includes("scroll up") || normalized.includes('scroll')) {
        chrome.windows.getCurrent({ populate: true }, (window) => {
            if (!window || !window.tabs) return;
            const activeTab = window.tabs.find(t => t.active);
            if (!activeTab) return;

            chrome.tabs.sendMessage(activeTab.id, { 
                action: "scrollPage", 
                command 
            });
        });
        return;
    }

    if (normalized.includes("new tab") || normalized.includes('open new tab') || normalized.includes('newtab')) {
        chrome.tabs.create({}); 
        //focus the new tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.update(tabs[0].id, { active: true });
            }
        });
        console.log("Executed: New Tab");
    } 
    
    if (normalized.includes("reload") || normalized.includes("refresh") || normalized.includes('reopen') || normalized.includes('reload tab')) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.reload(tabs[0].id);
                console.log("Executed: Reloaded current tab.");
            }
        });
    }

    if (normalized.includes("open"))
        // Open/search commands: support "open youtube and search for lofi music",
        // "search for lofi music on youtube", or generic "open <site>" + inject a genericContent script for custom search handling.
        if (normalized.includes("open") || normalized.includes("search")) {
            // Patterns:
            // 1) "search for <query> on <site>"
            // 2) "open <site> and search for <query>"
            // 3) "open <site>" (no query)
            // 4) "search for <query>" (no site) => use default search engine (Google)
            const searchOnRegex = /search(?:\s+for)?\s+(.+?)\s+(?:on|in)\s+([a-z0-9.-]+)/i;
            const openSearchRegex = /open\s+([a-z0-9.-]+)(?:\s+(?:and|then)\s+search(?:\s+for)?\s+(.+))?$/i;
            const openOnlyRegex = /open\s+([a-z0-9.-]+)/i;
            const searchOnlyRegex = /search(?:\s+for)?\s+(.+)/i;

            let site = null;
            let query = null;

            let m = normalized.match(searchOnRegex);
            if (m) {
                query = m[1].trim();
                site = m[2].trim();
            } else {
                m = normalized.match(openSearchRegex);
                if (m) {
                    site = m[1].trim();
                    if (m[2]) query = m[2].trim();
                } else {
                    m = normalized.match(openOnlyRegex);
                    if (m) site = m[1].trim();
                    m = normalized.match(searchOnlyRegex);
                    if (m) query = m[1].trim();
                }
            }

            // If neither found, fall through (not an open/search intent we can handle)
            if (!site && !query) {
                // do nothing here, let it fall through to unrecognized if appropriate
            } else {
                // Normalize site token (strip common suffixes)
                if (site) {
                    site = site.replace(/^www\./i, '');
                    site = site.replace(/\.(com|org|net|co|io|gov|edu|us|uk)$/i, '');
                }

                // Map well-known site -> search URL templates
                const buildSearchUrl = (s, q) => {
                    if (!s || !q) return null;
                    const qq = encodeURIComponent(q);
                    switch (s.toLowerCase()) {
                        case 'youtube':
                            return `https://www.youtube.com/results?search_query=${qq}`;
                        case 'amazon':
                            return `https://www.amazon.com/s?k=${qq}`;
                        case 'google':
                        case 'search':
                            return `https://www.google.com/search?q=${qq}`;
                        case 'duckduckgo':
                        case 'duck':
                            return `https://duckduckgo.com/?q=${qq}`;
                        case 'reddit':
                            return `https://www.reddit.com/search/?q=${qq}`;
                        case 'twitter':
                        case 'x':
                            return `https://twitter.com/search?q=${qq}`;
                        case 'wikipedia':
                            return `https://en.wikipedia.org/w/index.php?search=${qq}`;
                        case 'spotify':
                            return `https://open.spotify.com/search/${qq}`;
                        case 'vimeo':
                            return `https://vimeo.com/search?q=${qq}`;
                        default:
                            return null;
                    }
                };

                // If we have both a known site and a query, open a direct search URL
                if (site && query) {
                    const direct = buildSearchUrl(site, query);
                    if (direct) {
                        chrome.tabs.create({ url: direct });
                        console.log(`Executed: Opened ${site} search for "${query}"`);
                        return;
                    }
                }

                // If only a site is present (no query), open the site homepage
                if (site && !query) {
                    const url = site.match(/^https?:\/\//i) ? site : `https://${site}.com`;
                    chrome.tabs.create({ url }, (tab) => {
                        console.log(`Executed: Opened site ${url}`);
                    });
                    return;
                }

                // If we have a site that is not in our templates but do have a query,
                // open the site then inject genericContent.js (which should implement
                // a site-specific search handler based on the `site` field).
                if (site && query) {
                    const url = site.match(/^https?:\/\//i) ? site : `https://${site}.com`;
                    chrome.tabs.create({ url }, (tab) => {
                        if (!tab || !tab.id) return;

                            const listener = (tabId, info) => {
                                if (tabId !== tab.id) return;
                                if (info.status !== 'complete' && info.status !== 'loading') return;
                                // Wait until the tab finishes loading (complete) to inspect its final URL
                                if (info.status === 'complete') {
                                    chrome.tabs.onUpdated.removeListener(listener);
                                    // Get the most up-to-date tab info (URL) before injecting
                                    chrome.tabs.get(tab.id, (fullTab) => {
                                        const finalUrl = (fullTab && fullTab.url) ? fullTab.url : info.url || '';
                                        // If the tab ended up on an unexpected/parked domain (e.g. brokered domains),
                                        // avoid trying to inject (it will fail due to host permissions) and instead
                                        // navigate directly to a known search URL when possible.
                                        const domainMatch = finalUrl.toLowerCase().includes(site.toLowerCase());
                                        const direct = buildSearchUrl(site, query);

                                        if (!domainMatch && direct) {
                                            // Redirect the tab to the direct search URL instead of injecting
                                            chrome.tabs.update(tab.id, { url: direct }, () => {
                                                console.log(`Redirected tab to direct search ${direct} because final URL (${finalUrl}) did not match site ${site}`);
                                            });
                                            return;
                                        }

                                        // Try to inject genericContent.js; if injection fails due to permissions, fall back to direct URL
                                        chrome.scripting.executeScript({
                                            target: { tabId: tab.id },
                                            files: ['genericContent.js']
                                        }).then(() => {
                                            chrome.tabs.sendMessage(tab.id, {
                                                action: 'performSearch',
                                                site,
                                                query
                                            }, (resp) => {
                                                console.log(`Injected genericContent and requested search on ${site}: "${query}"`);
                                            });
                                        }).catch(err => {
                                            console.error('Error injecting genericContent.js:', err);
                                            if (direct) {
                                                chrome.tabs.update(tab.id, { url: direct });
                                                console.log(`Fallback: Navigated tab to direct search ${direct}`);
                                            } else if (query) {
                                                chrome.tabs.update(tab.id, { url: `https://www.google.com/search?q=${encodeURIComponent(query)}` });
                                                console.log('Fallback: Performed Google search as last resort');
                                            }
                                        });
                                    });
                                }
                            };
                            chrome.tabs.onUpdated.addListener(listener);
                    });
                    return;
                }

                // If we have only a query and no site, default to Google
                if (!site && query) {
                    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                    chrome.tabs.create({ url });
                    console.log(`Executed: Default search for "${query}"`);
                    return;
                }
            }
        }

        else {
            console.warn(`86 Hands: Unrecognized command or error: ${command} (normalized: ${normalized})`);
        }
}