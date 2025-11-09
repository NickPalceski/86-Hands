// JavaScript functionality for popup.html


// -----------------------------------------------------------------------------------------
// ENABLE/DISABLE BACKGROUND.JS FILE USING SLIDER 
// -----------------------------------------------------------------------------------------

// Get HTML elements
const toggle = document.getElementById('serviceToggle');
const statusText = document.getElementById('statusText');

// Restores previous state of slider toggle (on popup start)
// Persistent storage
chrome.storage.local.get('serviceEnabled', (data) => {
  const enabled = data.serviceEnabled || false;
  toggle.checked = enabled;
  statusText.textContent = enabled ? 'ON' : 'OFF';
});

// Toggle Status text (HTML)
toggle.addEventListener('change', (event) => {
  const enabled = event.target.checked;
  statusText.textContent = event.target.checked ? 'ON' : 'OFF';

  // Save toggle state in Chrome  storage (local)
  chrome.storage.local.set({ serviceEnabled: enabled });

  // Send message to background (Connectivity/Linking)
  chrome.runtime.sendMessage({ serviceEnabled: enabled });

});
