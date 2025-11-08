// JavaScript functionality for popup.html


// -----------------------------------------------------------------------------------------
// SLIDER SWITCH FUNCTIONALITY 
// -----------------------------------------------------------------------------------------

  // Get elements
  const toggle = document.getElementById('serviceToggle');
  const statusText = document.getElementById('statusText');

  // Toggle Status
  toggle.addEventListener('change', (event) => {
    statusText.textContent = event.target.checked ? 'ON' : 'OFF';
  });