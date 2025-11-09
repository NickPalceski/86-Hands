# Welcome to 86Hands! 🙌

86hands is a Google Chrome extension voice assistant extension that gives users a new way of interacting with their computer. This extension allows users to speak their commands, and have their browser adhere to it the same way it would using a keyboard and mouse. The goal of this project is to give users more options in the area of user input, and expand the usual human-computer interaction methods to new heights! This project was a submission for the first annual SharkByte hackathon!

**Features**

- **Real-time voice monitoring**: Monitor's the users voice and listens for keywords to activate.
- **Phrase-based activiation**: Requires certain phrases to be spoken to activate command requests.
- **Speech Parsing and analysis**: Analysis user's voice to determine intended commands/actions
- **Command translation**: Correlates user keywords in speech to browser commands.
- **Visual Feedback**: Status switch allows users to easily enable and disable the microphone. Microphone symbol on display on applicable browser tabs.

📂 Repository Structure
--------------------

```
voice-assistant-extension/
  ├── manifest.json         # Chrome extension configuration
  ├── background.js         # Service worker managing received speech and mapping to browser commands
  ├── api-handler.js        # Sends incoming user speech to Google Gemini to parse from
  ├── content.js            # Handles the capture of user speech and activation of command input via keywords
  ├── genericContent.js     # Subset of background.js that handles user commands on unknown websites/areas
  ├── popup.js              # Slider text functionality for popup.html, enables and disables extension functionality
  ├── settings.js           # Settings functionality, dark mode related code
  ├── gemini-proxy-function-root/
  │   ├── index.js          # Handles calling of Gemini API
  │   ├── package.json      # Formats Gemini API call for future use
  ├── icons/                # Google Chrome extension images
  ├── images/               # UI images
  ├── pages/
  │   ├── popup.html        # Main UI interface
  │   ├── settings.html     # Settings interface
  ├── pages/
  │   ├── popup.css         # popup.html styling
  │   ├── settings.css      # settings.html styling
```

## 🛠️ Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `extension` folder
5. The extension should now appear in your extensions list

## 🚗 Usage

1. Move to another tab from the Google Chrome extension manager
2. Enable the extension by clicking the slider in the main page (set to OFF by default)
3. To start sending commands, say "Hey 86", "Hello 86", or "Yo 86"
4. Next, clearly say the command you want to have executed (ex. search for an item)

## 💻 Development

This extension was built for SharkByte 2025 and uses:

- Chrome Extension Manifest V3
- Chrome Storage API for data persistence
- Chrome Tabs API for website monitoring
- Google Gemini API to parsing user speech

## 👑 Acknowledgements

This project is part of the SharkByte 2025 hackathon submission. Thank you to INIT, INIT MDC, the wonderful organizers, volunteers, and others that made such an incredible event possible.
