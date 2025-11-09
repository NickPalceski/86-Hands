

// Import Gemini API files
import { fetchCommand } from './api-handler.js';


// ------------------------------------------------------------------------------------------------------------------------------
// MESSAGING/COMMUNICATION HANDLER
// ------------------------------------------------------------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handling Toggling (from popup.js)
    if (typeof message.serviceEnabled !== 'undefined') {
        // Broadcast the toggle state to content.js
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                if (tab.url.startsWith('http')) { // Catch: Only send to valid web pages
                    chrome.tabs.sendMessage(tab.id, { serviceEnabled: message.serviceEnabled }).catch(() => {});
                }
            });
        });
    }

    // Handle Recognized Command,(from content.js)
    if (message.action === "processCommand" && message.speechText) {
        handleSpeech(message.speechText);
    }
    
}); // end messaging/communication handler

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