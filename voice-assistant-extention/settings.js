// JavaScript functionality for settings.js


// -----------------------------------------------------------------------------------------
// SLIDER SWITCH FUNCTIONALITY 
// -----------------------------------------------------------------------------------------

  // Get elements
  const toggle = document.getElementById('serviceToggle');
  const darkmodeText = document.getElementById('darkmodeText');

  // Toggle Status
  toggle.addEventListener('change', (event) => {
    darkmodeText.textContent = event.target.checked ? 'ON' : 'OFF';
  });