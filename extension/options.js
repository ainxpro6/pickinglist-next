// DOM Elements
const form = document.getElementById("settings-form");
const targetUrlInput = document.getElementById("target-url");
const toast = document.getElementById("toast");

// Load saved settings when options page opens
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get({ targetUrl: "http://localhost:3000" }, (items) => {
    targetUrlInput.value = items.targetUrl;
  });
});

// Save settings when form is submitted
form.addEventListener("submit", (e) => {
  e.preventDefault();

  let targetUrl = targetUrlInput.value.trim();

  // Validate URL format
  try {
    const urlObj = new URL(targetUrl);
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      alert("Format URL tidak valid! Harus diawali dengan http:// atau https://");
      return;
    }
  } catch (err) {
    alert("Format URL tidak valid! Pastikan formatnya benar.");
    return;
  }

  // Save to Chrome Sync storage
  chrome.storage.sync.set({ targetUrl: targetUrl }, () => {
    // Show success toast animation
    toast.classList.add("show");

    // Hide toast after 3 seconds
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  });
});
