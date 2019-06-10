import {
  getFromLocalStorage,
  setToLocalStorage,
  createWindow,
  removeWindow,
  executeScript,
  formatDate,
  readJsonFile,
  createDialog,
  infoDialog
} from '../util.js';

let $headerButtons;
let $scriptsList;
let loadingDialog;
let editDialog;
let scripts = [];
let scriptsEditors = [];

function init() {
  $headerButtons = $('.main-header .buttons button').on('click', headerButtonClick);
  $scriptsList = $('.scripts');

  initDialogs();

  getFromLocalStorage(['scripts']).then(data => scriptsLoaded(data.scripts));

  chrome.storage.local.onChanged.addListener(data => {
    if ('scripts' in data) {
      scriptsLoaded(data.scripts.newValue);
    }
  });
}

function scriptsLoaded(res) {
  scripts = res || [];
  renderScripts();
  $headerButtons.filter('.export').get(0).disabled = !scripts.length;
}

function initDialogs() {
  loadingDialog = createDialog({
    selector: '.dialog.loading', closeBy: ''
  });

  editDialog = createDialog({
    selector: '.dialog.edit',
    beforeOpen: ($el, config) => {
      $el.find('.origin').val(config.script.origin);
      $el.find('.save').off('click').on('click', config.save);

      let editor = editDialog.editor;
      if (!editor) {
        editor = editDialog.editor = ace.edit( $el.find('.code').get(0) );
        editor.setOptions({
          theme: 'ace/theme/chrome',
          mode: 'ace/mode/javascript',
          fontSize: 11,
          tabSize: 2,
          useSoftTabs: true
        });
      }

      editor.setValue(config.script.code);
      editor.selection.cursor.setPosition(0);
    }
  });
}

function renderScripts() {
  scriptsEditors.forEach(e => e.destroy());
  scriptsEditors = [];

  $scriptsList.empty();

  if (scripts.length) {
    $scriptsList.append( ...scripts.map(createScriptItem) );
  } else {
    $scriptsList.append( $('<div>', { class: 'empty', text: 'no data' }) );
  }
}

function createScriptItem(script, index) {
  const title = `Created - ${formatDate(script.createdAt)}, Updated - ${formatDate(script.updatedAt)}`;

  const $code = $('<div>', { class: 'code' });
  const editor = ace.edit( $code.get(0) );
  editor.setOptions({
    theme: 'ace/theme/chrome',
    mode: 'ace/mode/javascript',
    fontSize: 11,
    tabSize: 2,
    useSoftTabs: true,
    minLines: 1,
    maxLines: 10,
    readOnly: true,
    highlightActiveLine: false,
    highlightGutterLine: false
  });
  $(editor.renderer.$cursorLayer.element).hide();
  editor.setValue(script.code);
  editor.selection.clearSelection();
  scriptsEditors.push(editor);

  return $('<div>', {
    class: 'script'
  }).append(
    $('<div>', { class: 'panel' }).append(
      $('<div>', { class: 'origin' }).append(
        $('<a>', {
          text: script.origin, class: 'link', title,
          href: script.origin, target: '_blank'
        })
      ),
      $('<div>', { class: 'actions' }).append(
        $('<a>', {
          class: 'link', text: 'copy to cp', title: 'Copy script to clipboard',
          on: { click: () => copyToClipboardClick(index) }
        }),
        $('<a>', {
          class: 'link', text: 'edit', title: 'Edit script',
          on: { click: () => editClick(script) }
        }),
        $('<a>', {
          class: 'link', text: 'delete', title: 'Delete script',
          on: { click: () => deleteClick(script, index) }
        })
      )
    ),
    $code
  );
}

function copyToClipboardClick(index) {
  const editor = scriptsEditors[index];
  editor.selectAll();
  editor.focus();
  document.execCommand('copy');
  editor.selection.clearSelection();
}

function editClick(script) {
  editDialog.open({
    script,
    save: () => saveClick(script)
  });
}

function saveClick(script) {
  script.code = editDialog.editor.getValue();
  script.updatedAt = new Date().toJSON();

  loadingDialog.open();

  let wnd;
  createWindow({ url: script.origin, state: 'minimized' }).then(res => {
    wnd = res;
    return executeScript(wnd.tabs[0].id, {
      code: `localStorage['RunJsOnPageStart'] = ${JSON.stringify(script.code)}`
    });
  }).then(() => {
    return removeWindow(wnd.id);
  }).then(() => {
    return setToLocalStorage({ scripts });
  }).then(() => {
    loadingDialog.close();
  }).catch(err => {
    infoDialog.open({
      title: 'Error', text: err.message, buttons: [{ text: 'Ok' }]
    });
  });
}

function deleteClick(script, index) {
  infoDialog.open({
    title: 'Confirm',
    text: `Delete script from origin <b>${script.origin}</b>?`,
    buttons: [{
      text: 'Yes',
      click: () => deleteConfirm(script, index)
    }, {
      text: 'No'
    }]
  });
}

function deleteConfirm(script, index) {
  loadingDialog.open();
  let wnd;
  createWindow({ url: script.origin, state: 'minimized' }).then(res => {
    wnd = res;
    return executeScript(wnd.tabs[0].id, {
      code: `delete localStorage['RunJsOnPageStart']`
    });
  }).then(() => {
    return removeWindow(wnd.id);
  }).then(() => {
    scripts.splice(index, 1);
    return setToLocalStorage({ scripts });
  }).then(() => {
    loadingDialog.close();
  }).catch(err => {
    infoDialog.open({
      title: 'Error', text: err.message, buttons: [{ text: 'Ok' }]
    });
  });
}

function headerButtonClick(event) {
  const $btn = $(event.target);
  if ($btn.hasClass('export')) {
    exportJson();
  } else if ($btn.hasClass('import')) {
    importJson();
  }
}

function exportJson() {
  const $el = $('<a>', {
    download: 'scripts.json',
    href: URL.createObjectURL( new Blob([JSON.stringify(scripts, null, 2)]) )
  });
  $el.get(0).click();
  URL.revokeObjectURL($el.attr('href'));
}

function importJson() {
  const $el = $('<input>', {
    type: 'file', accept: '.json'
  }).click().on('change', () => {
    loadingDialog.open();
    const file = $el.get(0).files[0];
    readJsonFile(file).then(data => {
      data.forEach(item => {
        const script = scripts.find(s => s.origin.toLowerCase() === item.origin.toLowerCase());
        if (script) {
          Object.assign(script, item);
        } else {
          scripts.push(item);
        }
      });
    }).then(() => {
      return setToLocalStorage({ scripts })
    }).then(() => {
      loadingDialog.close();
    }).catch(err => {
      infoDialog.open({
        title: 'Error', text: err.message, buttons: [{ text: 'Ok' }]
      });
    });
  });
}

init();
