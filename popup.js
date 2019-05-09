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

function saveClick(event) {
  const reload = event.target.getAttribute('reload') !== null;

  currentScript.code = editor.getValue();
  currentScript.enabled = !!enabledEl.checked;

  saveScripts(allScripts).then(() => {
    const code = (currentScript.enabled && currentScript.code) ?
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

const codeEl = document.querySelector('.code');
const enabledEl = document.querySelector('.footer input[type="checkbox"]');
const btnEls = document.querySelectorAll('.footer button');

let allScripts;
let currentScript;
let activeTab;

btnEls.forEach(btn => btn.addEventListener('click', saveClick));

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

// Get scripts and active tab
Promise.all([getScripts(), getActiveTab()]).then(res => {
  [allScripts, activeTab] = res;

  const origin = new URL(activeTab.url).origin;

  currentScript = allScripts.find(s => s.origin === origin);
  if (!currentScript) {
    currentScript = { origin, code: '', enabled: true };
    allScripts.push(currentScript);
  }

  editor.setValue(currentScript.code);
  editor.selection.cursor.setPosition(0);
  enabledEl.checked = currentScript.enabled;
});
