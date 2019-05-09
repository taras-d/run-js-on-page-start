const codeEl = document.querySelector('.code');
const enabledEl = document.querySelector('.footer input[type="checkbox"]');
const btnEl = document.querySelector('.footer button');

// init edit
var editor = ace.edit(codeEl);
editor.setTheme('ace/theme/chrome');
editor.setOptions({
  theme: 'ace/theme/chrome',
  mode: 'ace/mode/javascript',
  fontSize: 12,
  tabSize: 2,
  useSoftTabs: true
});

// get settings from storage
chrome.storage.local.get(['settings'], data => {
  const settings = data.settings || {};
  editor.setValue(settings.code || '');
  editor.selection.cursor.setPosition(0);
  enabledEl.checked = !!settings.enabled;
});

btnEl.addEventListener('click', () => {
  const settings = {
    enabled: enabledEl.checked, code: editor.getValue()
  };

  // save settings to storage
  chrome.storage.local.set({ settings }, () => {
    // notify content script
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'apply', data: settings
      }, () => window.close());
    });
  });
});
