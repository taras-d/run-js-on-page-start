import {
  getFromLocalStorage,
  setToLocalStorage,
  createWindow,
  removeWindow,
  executeScript,
  formatDate
} from '../util.js';

let $tBody;
let loadingDialog;
let infoDialog;
let editDialog;
let scripts;

function init() {
  $tBody = $('.table tbody');

  initDialogs();

  getFromLocalStorage(['scripts']).then(data => {
    scripts = data.scripts;
    renderScripts();
  });

  chrome.storage.local.onChanged.addListener(data => {
    if ('scripts' in data) {
      scripts = data.scripts.newValue;
      renderScripts();
    }
  });
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
  $tBody.empty();
  if (scripts && scripts.length) {
    scripts.forEach((script, index) => {
      $tBody.append(createTableRow(script, index));
    })
  } else {
    $tBody.append(
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
      title: 'Error',
      text: err.message,
      buttons: [{ text: 'Ok' }]
    });
  });
}

function deleteClick(script, index) {
  infoDialog.open({
    title: 'Confirm',
    text: `Delete script from <b>${script.origin}</b>?`,
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
      title: 'Error',
      text: err.message,
      buttons: [{ text: 'Ok' }]
    });
  });
}

init();
