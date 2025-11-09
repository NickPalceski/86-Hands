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
    const command = parsedCommand.toLowerCase().trim();

    console.log(`SW: Executing command: ${command}`);

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
    else {
        console.warn(`86 Hands: Unrecognized command or error: ${command} (normalized: ${normalized})`);
    }
}