const codeEl = document.querySelector('.code');
const enabledEl = document.querySelector('.footer input[type="checkbox"]');
const btnEl = document.querySelector('.footer button');
const codeKey = 'RunJsOnPageStart';

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
  const enabled = enabledEl.checked;
  const code = editor.getValue();
  // save settings
  chrome.storage.local.set({ settings: { enabled, code } }, () => {
    // update code in active tab
    chrome.tabs.executeScript({
      code: (enabled && code) ? `localStorage['${codeKey}'] = ${JSON.stringify(code)}` :
        `delete localStorage['${codeKey}']`
    }, function() {
      // close popup & reload active tab
      window.close();
      chrome.tabs.reload();
    });
  });
});
