import {
  setToLocalStorage,
  getFromLocalStorage,
  executeScript,
  reloadTab
} from '../util.js';

const scriptKey = 'RunJsOnPageStart';
let editor;

function init() {
  document.querySelector('.footer button[name="inject"]').addEventListener('click', injectScriptClick);
  document.querySelector('.footer button[name="remove"]').addEventListener('click', removeScriptClick);

  initEditor();

  getFromLocalStorage(['script']).then(data => {
    const script = data.script || {};

    editor.setValue(script.code || '');
    editor.gotoLine((script.cursorRow || 0) + 1, script.cursorColumn || 0);
    editor.session.setScrollTop(script.scrollTop || 0);
    editor.session.setScrollLeft(script.scrollLeft || 0);

    editor.session.on('change', saveChanges);
    editor.session.on('changeScrollTop', saveChanges);
    editor.session.on('changeScrollLeft', saveChanges);
    editor.selection.on('changeCursor', saveChanges);
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
