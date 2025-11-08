// JavaScript functionality for settings.js

// Wire the dark-mode toggle: toggle a .dark class on <html>, persist to localStorage,
// and update the status text. Uses a smooth CSS transition for colors.

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('serviceToggle');
  const darkmodeText = document.getElementById('darkmodeText');
  const root = document.documentElement;

  function applyDarkMode(checked) {
    darkmodeText.textContent = checked ? 'ON' : 'OFF';
    root.classList.toggle('dark', checked);
    // Swap back button image depending on theme (paths are relative to the HTML file)
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
      backBtn.src = checked ? '../images/backBtnDark.png' : '../images/lightModeBackBtn.png';
    }
    try {
      localStorage.setItem('darkMode', checked ? 'true' : 'false');
    } catch (e) {
      // ignore storage errors (e.g., private mode)
      console.warn('Could not persist dark mode preference', e);
    }
  }

  // Initialize from saved preference, or fall back to system preference when unset
  const saved = localStorage.getItem('darkMode');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialDark = saved === 'true' || (saved === null && prefersDark);

  // Set initial UI state
  toggle.checked = initialDark;
  applyDarkMode(initialDark);

  // Listen for changes
  toggle.addEventListener('change', (event) => {
    applyDarkMode(event.target.checked);
  });
});