// Main functionality of the entire extension
// Includes user speech catching, speech parsing and translation via AI, and commands executed based on it

// ------------------------------------------------------------------------------------------------------------------------------
// STEP 1: INITIALIZATION AND START UP
// ------------------------------------------------------------------------------------------------------------------------------

// Import Gemini API files
import { fetchCommand } from './api-handler.js';

// Global Variables
let serviceEnabled = false;
let recognition; // For voice recognition, "beginning" sorta
let isListeningForCommand = false; // Only enables speech recognition when this boolean is enabled
let wakeWords = ["hey 86", "yo 86", "hello 86", "enable 86hands", "hi 86", "86hands"]; // Phrases to start speech recognition
// Maybe add spelled out numbers (???)

// Initializes Chrome's local storage state on startup
// Similar to the one in popup.js
chrome.storage.local.get('serviceEnabled', (data) => {

  serviceEnabled = data.serviceEnabled || false;
  if (serviceEnabled) 
      startWakeListener(); // Starts waiting for wake words to be said, beginning of speech recognition bee tee dubs

}); // end storage initialization


// Popup.js sends messages to this function V
chrome.runtime.onMessage.addListener((message) => {

  if (typeof message.serviceEnabled !== 'undefined') { // Makes sure value is a boolean (refer to popup.js)
    serviceEnabled = message.serviceEnabled;
    if (serviceEnabled) { // if the slider is on, 'enable' background.js file
      startWakeListener();
    } 
    else { // if slider is off, do nothing (closest to turning off background.js)
      stopListening();
    }
  }

}); // end popup.js message interpreter



// ------------------------------------------------------------------------------------------------------------------------------
// STEP 2: WAKE WORD SPEECH RECOGNITION 
// ------------------------------------------------------------------------------------------------------------------------------


// Executes when wake words are heard, refer to global variables
function startWakeListener() {

  if (recognition) return; // Crucial to have, prevents duplicate processes (program blows up)
  console.log("Wake word heard, listen for user speech."); // For confirmation purposes


  // Recognition class/library initialization
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US'; // Language used

  // On heard event
  recognition.onresult = async (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim(); // translates text to lowercase ONLY
    console.log("Heard:", transcript); // Outputs its interpretation of raw user speech

    if (!isListeningForCommand) {

      // Checks if user's speech includes one of the wake words
      if (wakeWords.some((phrase) => transcript.includes(phrase))) {

        // For confirmation
        console.log("Wake word detected!: ");  
        console.log(phrase);
        console.log("Listening for next command...");

        // Fully enables listening command
        isListeningForCommand = true;

        // After hearing a wake word, start a one-time listener for next command
        recognition.stop(); // ends wake up phrase recognition
        setTimeout(startCommandListener, 500); // Adds small delay between shutting down wake word speech recognition and starting command recognitino
      }
    }
};

// Error Handling
recognition.onerror = (e) => console.error("Error in speech detection, value: ", e);


recognition.onend = () => {
  if (serviceEnabled && !isListeningForCommand) {
    recognition.start(); // keep listening for wake word
  }
};

recognition.start(); // Restart speech recognition for command speech


} // end startWakeListener

// ------------------------------------------------------------------------------------------------------------------------------
// STEP 3: USER SPEECH COMMAND RECOGNITION
// ------------------------------------------------------------------------------------------------------------------------------

// Starts listening for user's command
function startCommandListener() {

  if (!serviceEnabled) return; // Safety net, prevents multiple processes from running at the same time

  const commandRec = new webkitSpeechRecognition();
  commandRec.continuous = false;
  commandRec.interimResults = false;
  commandRec.lang = 'en-US';

  console.log("Listening for user's command."); // For confirmation

  // 
  commandRec.onresult = async (event) => {
    const commandText = event.results[0][0].transcript;
    console.log("User command:", commandText); // Confirms user command

    await handleSpeech(commandText); // Jump to handleSpeech function, return when function is over

    // Return to wake-word listening, restarts cycle
    isListeningForCommand = false;
    setTimeout(startWakeListener, 1000); // Delay between stopping one timer and starting a new one
  };

  // Error Handling
  commandRec.onerror = (e) => {
    console.error("Error: failed to recognize user command, value: ", e);
    isListeningForCommand = false; // Exit process
    startWakeListener(); // Restart process
  };

  commandRec.start();

}  // end startCommandListener


// ------------------------------------------------------------------------------------------------------------------------------
// STEP 4: SPEECH PARSING VIA AI
// ------------------------------------------------------------------------------------------------------------------------------

// User speech intro function, prepares and send to AI for review
async function handleSpeech(text) {

  console.log("User's speech:", text); // For confirmation
  const parsedCommand = await fetchCommand(text); // Gemini's result
  console.log("AI has returned:", parsedCommand); // AI result
  executeCommand(parsedCommand); // Executes based on user command + AI parsing

}

async function getAIParsedCommand(text) {
    return fetchCommand(text);
}


// ------------------------------------------------------------------------------------------------------------------------------
// STEP 5: COMMAND EXECUTION
// ------------------------------------------------------------------------------------------------------------------------------

function executeCommand(parsedCommand) {
    const command = parsedCommand.toLowerCase().trim();

    console.log(`Executing command: ${command}`);

    if (command.startsWith("search:")) {
        const query = command.substring(7).trim();
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        chrome.tabs.create({ url: searchUrl }); // Open search query in a new tab
        console.log(`Executed: Search for "${query}"`);
    } 
    else if (command.includes("new_tab")) {
        chrome.tabs.create({}); // Creates a new tab
        console.log("Executed: New Tab");
    } 
    else if (command.includes("close_tab")) {
        // Requires 'tabs' permission in manifest
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
        console.warn(`Execution failed: Unrecognized command or error: ${command}`);
    }
}


// Stop listening to user's speech
function stopListening() {
  console.log("Voice recognition disabled, sorry!");
  if (recognition) { // If recognition value is enabled from past function
    recognition.stop();
    recognition = null; // hard stop to entire process
  }
  isListeningForCommand = false;
}


/*
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "processCommand") {
    handleCommand(request.command.toLowerCase());
  }
});

async function handleCommand(command) {
  console.log("Processing command:", command);

  // Tab switching
  if (command.includes("switch to next tab")){
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
            const currentIndex= activeTabs[0].index;
            const nextIndex = (currentIndex + 1) % tabs.length;
            chrome.tabs.update(tabs[nextIndex].id, { active: true });
        });
    });
    return;
  }

  if (command.includes("switch to previous tab")){
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
            const currentIndex= activeTabs[0].index;
            const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            chrome.tabs.update(tabs[prevIndex].id, { active: true });
        });
    });
    return;
  }

  // Scrolling Functionality
  if (command.includes("scroll down") || command.includes("scroll up")) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "scrollPage", command });
    });
    return;
  }

  // Searching Functionality
  const siteMatch = command.match(/open\s+(\w+)/);
  const queryMatch = command.match(/search\s+(?:for\s+)?(.+)/);

  const site = siteMatch ? siteMatch[1] : null;
  const query = queryMatch ? queryMatch[1] : null;

  if (!site) return console.warn("No target site found in command.");

  // YouTube search
  if (site.toLowerCase() === "youtube" && query) {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    await chrome.tabs.create({ url: searchUrl });
    return;
  }

  // generic sites
  let url = `https://${site}.com`;
  const tab = await chrome.tabs.create({ url });

  chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
    if (tabId === tab.id && info.status === "complete") {
      chrome.tabs.onUpdated.removeListener(listener);

      // Inject generic script for other sites
      const scriptToInject = "genericContent.js";

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [scriptToInject]
      }).then(() => {
        if (query) {
          chrome.tabs.sendMessage(tab.id, {
            action: "performSearch",
            site,
            query
          });
        }
      });
    }
  });
}

*/