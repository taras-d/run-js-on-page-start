function toggleBrowserAction(tabId, url) {
  if (/^(ftp|file|http|https):\/\//i.test(url)) {
    chrome.browserAction.enable(tabId);
  } else {
    chrome.browserAction.disable(tabId);
  }
}

chrome.tabs.getSelected(tab => toggleBrowserAction(tab.id, tab.url));

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    toggleBrowserAction(tabId, changeInfo.url);
  }
});
