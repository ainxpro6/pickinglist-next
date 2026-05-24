// Listen for the extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (!tab.url) return;

  const url = tab.url.trim();

  // Validate: URL starts with "https://desty-upload-indonesia" and contains/ends with ".pdf"
  const isDesty = url.startsWith("https://desty-upload-indonesia");
  const isPdf = url.toLowerCase().includes(".pdf");

  if (isDesty && isPdf) {
    // Retrieve the target app URL from storage (defaults to localhost)
    chrome.storage.sync.get({ targetUrl: "http://localhost:3000" }, (items) => {
      let targetAppUrl = items.targetUrl.trim();
      
      // Ensure target URL doesn't end with a trailing slash
      if (targetAppUrl.endsWith("/")) {
        targetAppUrl = targetAppUrl.slice(0, -1);
      }

      const redirectUrl = `${targetAppUrl}/?pdf_url=${encodeURIComponent(url)}`;

      // Create new tab immediately to the right of the current active tab
      chrome.tabs.create({
        url: redirectUrl,
        index: tab.index + 1,
        active: true
      });
    });
  } else {
    // Show a desktop notification if clicked on a non-matching page
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "Picking List App",
      message: "Halaman ini bukan PDF Desty Omni yang valid! Pastikan link diawali dengan 'https://desty-upload-indonesia' dan diakhiri dengan '.pdf'.",
      priority: 2
    });
  }
});
