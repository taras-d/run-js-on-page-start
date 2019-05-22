import {
  getFromLocalStorage,
  setToLocalStorage,
  createWindow,
  removeWindow,
  executeScript,
  formatDate,
  readJsonFile
} from '../util.js';

let $headerButtons;
let $tableBody;
let loadingDialog;
let infoDialog;
let editDialog;
let scripts;

function init() {
  $headerButtons = $('.main-header .buttons button').on('click', headerButtonClick);
  $tableBody = $('.table tbody');

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

  infoDialog = createDialog({
    selector: '.dialog.info',
    beforeOpen: ($el, config) => {
      $el.find('.dialog-title').html(config.title).toggleClass('hidden', !config.title);
      $el.find('.dialog-body .text').html(config.text);
      const $buttons = $el.find('.dialog-body .buttons').empty();
      config.buttons.forEach(btn => {
        $('<button>', {
          text: btn.text,
          on: { click: btn.click },
          class: 'dialog-close'
        }).appendTo($buttons);
      });
    }
  });

  editDialog = createDialog({
    selector: '.dialog.edit',
    beforeOpen: ($el, config) => {
      $el.find('.origin').val(config.script.origin);
      $el.find('.save').off('click').on('click', config.save);

      let editor = editDialog.editor;
      if (!editor) {
        editor = editDialog.editor = ace.edit( $el.find('.code').get(0) );
        editor.setTheme('ace/theme/chrome');
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

function createDialog(options) {
  options = $.extend({
    closeBy: 'esc,backdrop',
    closeByEsc: true, closeByBackdrop: true, beforeOpen: $.noop
  }, options);

  const $el = $(options.selector);
  $el.on('click', event => {
    const $target = $(event.target);
    if (
      $target.closest('.dialog-close').length ||
      (options.closeBy.includes('backdrop') && !$target.closest('.dialog-box').length)
    ) {
      $el.get(0).close();
    }
  });
  $el.on('cancel', event => {
    if (!options.closeBy.includes('esc')) {
      event.preventDefault();
    }
  });

  const dialog = {
    open: config => {
      options.beforeOpen($el, config);
      $('dialog[open]').each((index, el) => el.close());
      $el.get(0).showModal();
    },
    close: () => $el.get(0).close()
  };

  return dialog;
}

function renderScripts() {
  $tableBody.empty();
  if (scripts.length) {
    scripts.forEach((script, index) => {
      $tableBody.append(createTableRow(script, index));
    })
  } else {
    $tableBody.append(
      $('<tr>').append(
        $('<td>', {
          text: 'no data', class: 'empty',
          attr: { colspan: 5 }
        })
      )
    );
  }
}

function createTableRow(script, index) {
  return $('<tr>').append(
    $('<td>').append(
      $('<a>', {
        text: script.origin, class: 'link',
        href: script.origin, target: '_blank'
      })
    ),
    $('<td>', {
      class: 'code'
    }).append(
      $('<pre>', {
        text: script.code
      })
    ),
    $('<td>', {
      class: 'date',
      text: formatDate(script.createdAt)
    }),
    $('<td>', {
      class: 'date',
      text: formatDate(script.updatedAt)
    }),
    $('<td>', {
      class: 'actions'
    }).append(
      $('<a>', {
        class: 'link', text: 'edit',
        on: { click: () => editClick(script, index) }
      }),
      $('<a>', {
        class: 'link', text: 'delete',
        on: { click: () => deleteClick(script, index) }
      })
    )
  );
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
