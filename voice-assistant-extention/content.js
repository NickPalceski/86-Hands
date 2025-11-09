// Relates to all user speech-related functions


// Global Variables
let serviceEnabled = false;
let recognition;
let isListeningForCommand = false; // Only enables speech recognition when this boolean is enabled
let wakeWords = ["hey 86", "yo 86", "hello 86", "enable 86hands", "hi 86", "86hands"]; // Phrases to start speech recognition


// Initializes Chrome's local storage state on startup
// Similar to the one in popup.js
chrome.storage.local.get('serviceEnabled', (data) => {

    serviceEnabled = data.serviceEnabled || false;

    // Informative log so developers know the content script read storage on load
    if (serviceEnabled) {
        console.log("Content script: serviceEnabled is true on load. Will start wake listener when ready.");
        // If page is already fully loaded, start immediately; otherwise wait for load
        if (document.readyState === 'complete') {
            startWakeListener();
        } else {
            window.addEventListener('load', () => {
                startWakeListener();
            });
        }
    } else {
        console.log("Content script: serviceEnabled is false on load.");
    }

});


// Listens for messages from the popup/service worker to enable/disable the service
chrome.runtime.onMessage.addListener((message) => {
    if (typeof message.serviceEnabled !== 'undefined') {
        serviceEnabled = message.serviceEnabled; // Update the global state
        console.log('Content script: received serviceEnabled message ->', serviceEnabled);
        if (serviceEnabled) {
            startWakeListener();
        } else {
            stopListening();
        }
    }
});

// -----------------------------------------------------------------------------------------------------------------------------
// SPEECH RECOGNITION
// -----------------------------------------------------------------------------------------------------------------------------


// Executes when wake words are heard, refer to global variables
function startWakeListener() {

    console.log('Content script: startWakeListener called (serviceEnabled =', serviceEnabled, ')');

    // Only works if webkitSpeechRecognition is available 
    if (typeof webkitSpeechRecognition === 'undefined') {
        console.error("Error: webkitSpeechRecognition is not defined in this context.");
        return; 
    }

    if (recognition && serviceEnabled) return;
    console.log("Listening for wake word...");

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

                // Fully enables listening command
                isListeningForCommand = true;

                // After hearing a wake word, start a one-time listener for next command
                recognition.stop(); // ends wake up phrase recognition
                recognition = null; // allow startWakeListener to create a fresh instance later
                startCommandListener(); // Adds small delay between shutting down wake word speech recognition and starting command recognition
            }
        }
    };

    recognition.onstart = () => {
        console.log('Wake recognition: started');
    };

    recognition.onaudiostart = () => {
        console.log('Wake recognition: audio started');
    };

    // Error Handling
    recognition.onerror = (e) => {
        console.error("Error in speech detection, value: ", e.error); // Log the specific error type
        // If the error is not a lack of permission (which can't be fixed by restarting), try again.
        if (e.error !== 'not-allowed' && serviceEnabled) {
            // Stop any running instance before trying to start again
            try {
                recognition.stop();
            } catch (err) {}
            recognition = null;
            // attempt restart after short delay
            setTimeout(() => {
                if (serviceEnabled && !isListeningForCommand) startWakeListener();
            }, 500);
        }
    };


    recognition.onend = () => {
        console.log('Wake recognition: ended');
        // Clear the reference so startWakeListener will recreate a fresh instance
        recognition = null;
        // Only restart the wake listener if the service is ON AND we are NOT waiting for a command
        if (serviceEnabled && !isListeningForCommand) {
            console.log("Restarting wake word listener (recreate)...");
            setTimeout(() => {
                startWakeListener();
            }, 200);
        }
    };

    try {
        if (serviceEnabled) {
            console.log('Starting wake recognition instance...');
            recognition.start(); // Restart speech recognition for command speech
        }
    } catch (e) { // Error Handler
        // Prevent "already started" errors
        console.warn("Error: recognition start attempted while already running.");
    }


} // end startWakeListener


// Starts listening for user's command
function startCommandListener() {

    // Checks if webkitSpeechRecog even exists
    if (!serviceEnabled || typeof webkitSpeechRecognition === 'undefined') return; 

    const commandRec = new webkitSpeechRecognition();
    commandRec.continuous = false;
    commandRec.interimResults = false;
    commandRec.lang = 'en-US';

    console.log("Listening for user's command."); // For confirmation

  
    commandRec.onresult = async (event) => {
        const commandText = event.results[0][0].transcript;
        console.log("User Command: ", commandText); // Confirms user command


        // Sends  raw text to the Service Worker (background.js), will handle the secure GCF/Gemini call
        chrome.runtime.sendMessage({
            action: "processCommand",
            speechText: commandText
        });

        // Return to wake-word listening, restarts cycle
        isListeningForCommand = false;
        // Best-effort: ensure we restart wake listener after this one-shot ends
        setTimeout(() => {
            if (serviceEnabled && !isListeningForCommand) startWakeListener();
        }, 1200);
  };

    commandRec.onend = () => {
        console.log('Command recognition ended');
        // Ensure wake listener resumes if service still enabled
        if (serviceEnabled && !isListeningForCommand) {
            setTimeout(() => startWakeListener(), 200);
        }
    };

    // Error Handling
    commandRec.onerror = (e) => {
        console.error("Error: failed to recognize user command, value: ", e);
        isListeningForCommand = false; // Exit process
        startWakeListener(); // Restart process
    };

    commandRec.start();

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