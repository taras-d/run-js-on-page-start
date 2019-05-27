chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (/^(file|http|https):\/\//i.test(changeInfo.url)) {
    chrome.browserAction.enable(tabId);
  } else {
    chrome.browserAction.disable(tabId);
  }
});
