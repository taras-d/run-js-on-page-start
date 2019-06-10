import {
  setToLocalStorage,
  getFromLocalStorage,
  getSelectedTab,
  executeScript,
  reloadTab,
  infoDialog
} from '../util.js';

let scripts;
let currentScript;
let selectedTab;
let editor;

function init() {
  $('.footer button').on('click', saveClick);
  $('.footer .manage-scripts').on('click', manageScriptsClick);

  initEditor();

  Promise.all([
    getFromLocalStorage(['scripts']),
    getSelectedTab()
  ]).then(res => {
    scripts = res[0].scripts || [];
    selectedTab = res[1];

    const origin = new URL(selectedTab.url).origin;
  
    currentScript = scripts.find(s => s.origin === origin);
    if (!currentScript) {
      currentScript = { origin, code: '' };
      scripts.unshift(currentScript);
    }
  
    editor.setValue(currentScript.code);
    editor.selection.cursor.setPosition(0);
  });
}

function initEditor() {
  editor = ace.edit( $('.code').get(0) );
  editor.setOptions({
    theme: 'ace/theme/chrome',
    mode: 'ace/mode/javascript',
    fontSize: 11,
    tabSize: 2,
    useSoftTabs: true
  });
}

function saveClick(event) {
  const date = new Date().toJSON();
  currentScript.createdAt = currentScript.createdAt || date;
  currentScript.updatedAt = date;
  currentScript.code = editor.getValue();

  const code = currentScript.code ?
    `localStorage['RunJsOnPageStart'] = ${JSON.stringify(currentScript.code)}` :
    `delete localStorage['RunJsOnPageStart']`;
  
  executeScript({ code }).then(() => {
    return setToLocalStorage({ scripts });
  }).then(() => {
    if ( $(event.target).hasClass('reload') ) {
      return reloadTab();
    }
  }).then(() => {
    window.close();
  }).catch(err => {
    infoDialog.open({
      title: 'Error', text: err.message, buttons: [{ text: 'Ok' }]
    });
  });
}

function manageScriptsClick() {
  chrome.runtime.openOptionsPage();
}

init();
