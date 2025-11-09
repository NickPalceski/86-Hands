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


🏗️ Prerequisites
-------------
Install the tools needed for the project's language(s). 
- Node.js (LTS) and npm or yarn (if extension uses JS/TS)
- Python 3.8+ (if there are Python components)
- Browser (Chrome/Edge/Firefox) for testing extension UI
- Git

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `extension` folder
5. The extension should now appear in your extensions list


Suggested commands to put inside voice-assistant-extention/README.md (adapt to actual stack):

Node (JavaScript/TypeScript)
```bash
cd voice-assistant-extention
# install
npm install

# build
npm run build

# run in dev mode
npm run dev

# load unpacked extension into your browser
#  - Chrome: chrome://extensions/ → Load unpacked → select ./voice-assistant-extention
```

Python (if applicable)
```bash
cd voice-assistant-extention
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# run dev script
python -m my_extension.entrypoint


**Acknowledgements**

This project is part of the SharkByte 2025 hackathon submission. Thank you to INIT, INIT MDC, the wonderful organizers, volunteers, and others that made such an incredible event possible.
