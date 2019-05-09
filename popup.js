const codeEl = document.querySelector('.code');
const enabledEl = document.querySelector('.footer input[type="checkbox"]');
const btnEls = document.querySelectorAll('.footer button');

const codeKey = 'RunJsOnPageStart';

function saveSettings(reload) {
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
      if (reload) {
        chrome.tabs.reload();
      }
    });
  });
}

// Init editor
const editor = ace.edit(codeEl);
editor.setTheme('ace/theme/chrome');
editor.setOptions({
  theme: 'ace/theme/chrome',
  mode: 'ace/mode/javascript',
  fontSize: 11,
  tabSize: 2,
  useSoftTabs: true
});

// Get settings from storage
chrome.storage.local.get(['settings'], data => {
  const settings = data.settings || {};
  editor.setValue(settings.code || '');
  editor.selection.cursor.setPosition(0);
  enabledEl.checked = !!settings.enabled;
});

btnEls.forEach(btn => {
  btn.addEventListener('click', () => {
    saveSettings(btn.getAttribute('reload') !== null);
  });
});
