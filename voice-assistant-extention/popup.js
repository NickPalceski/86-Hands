// JavaScript functionality for popup.html


// -----------------------------------------------------------------------------------------
// SLIDER SWITCH FUNCTIONALITY 
// -----------------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('serviceToggle');
  const statusText = document.getElementById('statusText');

  // Verifies elements are present on screen
  if (!toggle || !statusText) return;

  toggle.addEventListener('change', (event) => {
    statusText.textContent = event.target.checked ? 'ON' : 'OFF';
  });
});
