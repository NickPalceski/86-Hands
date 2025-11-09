// Import Gemini API files
import { fetchCommand } from './api-handler.js';


// ------------------------------------------------------------------------------------------------------------------------------
// MESSAGING/COMMUNICATION HANDLER
// ------------------------------------------------------------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 1. Handle Toggling (from popup.js)
    if (typeof message.serviceEnabled !== 'undefined') {
        
        // Query for the currently active tab in the focused window
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0 && tabs[0].url && tabs[0].url.startsWith('http')) {
                const activeTabId = tabs[0].id;

                // Send the message directly to the single active tab
                chrome.tabs.sendMessage(activeTabId, { 
                    serviceEnabled: message.serviceEnabled 
                }).catch((error) => {
                    // This will often show "Could not establish connection." 
                    // which is normal if the content script hasn't loaded yet.
                    console.warn(`Error sending toggle message to tab ${activeTabId}:`, error.message);
                });
            } else {
                console.warn("Cannot activate speech recognition: No active, valid web page found.");
            }
        });
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

    console.log(`Service Worker: Executing command: ${command}`);

    if (command.startsWith("search:")) {
        const query = command.substring(7).trim();
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        chrome.tabs.create({ url: searchUrl }); 
        console.log(`Executed: Search for "${query}"`);
    } 
    else if (command.includes("new_tab")) {
        chrome.tabs.create({}); 
        console.log("Executed: New Tab");
    } 
    else if (command.includes("close_tab")) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.remove(tabs[0].id);
                console.log("Executed: Closed current tab.");
            }
        });
    }
    else if (command.includes("reload") || command.includes("refresh")) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.reload(tabs[0].id);
                console.log("Executed: Reloaded current tab.");
            }
        });
    }
    else {
        console.warn(`Error: Execution failed: Unrecognized command or error: ${command}`);
    }
}