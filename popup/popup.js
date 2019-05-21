function getScripts() {
  return new Promise(resolve => {
    chrome.storage.local.get(['scripts'], data => {
      resolve(data.scripts || []);
    });
  });
}

function saveScripts(scripts) {
  return new Promise(resolve => {
    chrome.storage.local.set({ scripts }, resolve);
  });
}

function getActiveTab() {
  return new Promise(resolve => {
    chrome.tabs.getSelected(resolve);
  });
}

function executeScript(code) {
  return new Promise(resolve => {
    chrome.tabs.executeScript({ code }, resolve);
  });
}

function saveChanges(reload) {
  const date = new Date().toJSON();
  currentScript.createdAt = currentScript.createdAt || date;
  currentScript.updatedAt = date;
  currentScript.code = editor.getValue();

  saveScripts(allScripts).then(() => {
    const code = currentScript.code ?
      `localStorage['RunJsOnPageStart'] = ${JSON.stringify(currentScript.code)}` :
      `delete localStorage['RunJsOnPageStart']`;
    return executeScript(code);
  }).then(() => {
    window.close();
    if (reload) {
      chrome.tabs.reload();
    }
  });
}

$('.footer button').on('click', event => saveChanges($(event.target).hasClass('reload')));

let allScripts;
let currentScript;
let activeTab;

// Init editor
const editor = ace.edit( $('.code')[0] );
editor.setTheme('ace/theme/chrome');
editor.setOptions({
  theme: 'ace/theme/chrome',
  mode: 'ace/mode/javascript',
  fontSize: 11,
  tabSize: 2,
  useSoftTabs: true
});

// Get scripts and active tab
Promise.all([getScripts(), getActiveTab()]).then(res => {
  [allScripts, activeTab] = res;

  const origin = new URL(activeTab.url).origin;

  currentScript = allScripts.find(s => s.origin === origin);
  if (!currentScript) {
    currentScript = { origin, code: '' };
    allScripts.push(currentScript);
  }

  editor.setValue(currentScript.code);
  editor.selection.cursor.setPosition(0);
});
