import {
  setToLocalStorage,
  getFromLocalStorage,
  executeScript,
  reloadTab
} from '../util.js';

const scriptKey = 'RunJsOnPageStart';
let script;
let injectedCode;
let editor;

function init() {
  document.querySelector('.footer button[name="inject"]').addEventListener('click', injectScriptClick);
  document.querySelector('.footer button[name="remove"]').addEventListener('click', removeScriptClick);

  initEditor();

  Promise.all([
    getSavedScript(),
    getInjectedCode()
  ]).then(res => {
    [script, injectedCode] = res;

    editor.setValue(script.code);
    editor.gotoLine(script.cursorRow + 1, script.cursorColumn);
    editor.session.setScrollTop(script.scrollTop);
    editor.session.setScrollLeft(script.scrollLeft);

    editor.session.on('change', () => {
      saveChanges();
      updateStatus();
    });
    editor.session.on('changeScrollTop', saveChanges);
    editor.session.on('changeScrollLeft', saveChanges);
    editor.selection.on('changeCursor', saveChanges);

    updateStatus();
  });
}

function initEditor() {
  editor = ace.edit(document.querySelector('.code'));
  editor.setOptions({
    theme: 'ace/theme/chrome',
    mode: 'ace/mode/javascript',
    fontSize: 11,
    tabSize: 2,
    useSoftTabs: true
  });
}

function getSavedScript() {
  return getFromLocalStorage(['script']).then(res => {
    return Object.assign({
      code: '',
      cursorRow: 0,
      cursorColumn: 0,
      scrollTop: 0,
      scrollLeft: 0
    }, res.script);
  });
}

function getInjectedCode() {
  return executeScript({ code: `localStorage['${scriptKey}']` }).then(res => res[0]);
}

function updateStatus() {
  let title;
  let color;

  if (typeof injectedCode !== 'string') {
    title = 'Not injected';
    color = 'silver';
  } else if (injectedCode === editor.getValue()) {
    title = 'Injected';
    color = 'limegreen';
  } else {
    title = 'Old script injected';
    color = 'orange';
  }

  const statusEl = document.querySelector('.footer .status');
  statusEl.title = title;
  statusEl.style.backgroundColor = color;
}

function saveChanges() {
  const cursor = editor.selection.cursor.getPosition();
  setToLocalStorage({
    script: {
      code: editor.getValue(),
      cursorRow: cursor.row,
      cursorColumn: cursor.column,
      scrollTop: editor.session.getScrollTop(),
      scrollLeft: editor.session.getScrollLeft()
    }
  });
}

function injectScriptClick() {
  executeScript({
    code: `localStorage['${scriptKey}'] = ${JSON.stringify(editor.getValue())}`
  }).then(() => {
    return reloadTab();
  }).then(() => {
    window.close();
  });
}

function removeScriptClick() {
  executeScript({ code: `delete localStorage['${scriptKey}']` }).then(() => {
    return reloadTab();
  }).then(() => {
    window.close();
  });
}

init();
