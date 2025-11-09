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
    
    // Only attempt to start if the service is enabled AND the tab is fully loaded
    if (serviceEnabled && document.readyState === 'complete') {
        startWakeListener(); // Starts waiting for wake words to be said
    }

}); // end storage initialization


// Listens for messages from the popup/service worker to enable/disable the service
chrome.runtime.onMessage.addListener((message) => {
    if (typeof message.serviceEnabled !== 'undefined') {
        serviceEnabled = message.serviceEnabled; // Update the global state
        if (serviceEnabled) {
            startWakeListener(); // Starts the microphone listening
        } else {
            stopListening(); // Stops the microphone listening
        }
    }
}); // end addListener

// -----------------------------------------------------------------------------------------------------------------------------
// SPEECH RECOGNITION
// -----------------------------------------------------------------------------------------------------------------------------


// Executes when wake words are heard, refer to global variables
function startWakeListener() {

    // Only works if webkitSpeechRecognition is available 
    if (typeof webkitSpeechRecognition === 'undefined') {
        console.error("Error: webkitSpeechRecognition is not defined in this context.");
        return; 
    }
    if (recognition && serviceEnabled) return;
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
                console.log("Wake word detected! Listening for next command...");

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

    try {
        if (serviceEnabled) {
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
        console.log("User command: ", commandText); // Confirms user command


        // Sends  raw text to the Service Worker (background.js), will handle the secure GCF/Gemini call
        chrome.runtime.sendMessage({
            action: "processCommand",
            speechText: commandText
        });

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

// Stop listening to user's speech
function stopListening() {
    
  console.log("Voice recognition disabled, sorry!");
  if (recognition) { // If recognition value is enabled from past function
    recognition.stop();
    recognition = null; // hard stop to entire process
  }
  isListeningForCommand = false;
   
} // end stopListening function