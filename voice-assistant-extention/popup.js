// JavaScript functionality for popup.html

// Initialize dark mode on load (reads the saved preference) and keep existing
// toggle behavior for the service switch.

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('serviceToggle');
  const statusText = document.getElementById('statusText');
  const settingsCog = document.getElementById('settingsCog');

  // Apply theme preference from localStorage (if any)
  try {
    const saved = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = saved === 'true' || (saved === null && prefersDark);
    document.documentElement.classList.toggle('dark', initialDark);
    // Swap settings cog icon for dark mode if present
    if (settingsCog) {
      settingsCog.src = initialDark ? '../images/cogSymbolDark.jpg' : '../images/settings_cog.png';
    }
  } catch (e) {
    // ignore storage errors
    console.warn('Could not read dark mode preference', e);
  }

  // Keep existing toggle behavior for ON/OFF status display
  if (toggle && statusText) {
    toggle.addEventListener('change', (event) => {
      statusText.textContent = event.target.checked ? 'ON' : 'OFF';
    });
  }
});