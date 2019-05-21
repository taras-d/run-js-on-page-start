import {
  setToLocalStorage,
  getFromLocalStorage,
  getSelectedTab,
  executeScript,
  reloadTab
} from '../util.js';

let scripts;
let currentScript;
let selectedTab;
let editor;

function init() {
  $('.footer button').on('click', saveClick);

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
  editor = ace.edit( $('.code')[0] );
  editor.setTheme('ace/theme/chrome');
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

  setToLocalStorage({ scripts }).then(() => {
    const code = currentScript.code ?
      `localStorage['RunJsOnPageStart'] = ${JSON.stringify(currentScript.code)}` :
      `delete localStorage['RunJsOnPageStart']`;
    return executeScript({ code });
  }).then(() => {
    if ( $(event.target).hasClass('reload') ) {
      return reloadTab();
    }
  }).then(() => {
    window.close();
  });
}

init();
