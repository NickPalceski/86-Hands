// JavaScript functionality for popup.html


// -----------------------------------------------------------------------------------------
// SLIDER SWITCH FUNCTIONALITY 
// -----------------------------------------------------------------------------------------

const checkbox = document.getElementById("toggleSwitch");
const statusText = document.getElementById("status");

    checkbox.addEventListener("change", () => {
      statusText.textContent = checkbox.checked ? "ON" : "OFF";
    });