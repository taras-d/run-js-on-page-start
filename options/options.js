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
let confirmDialog;
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
    selector: '.dialog.loading',
    closeByEsc: false,
    closeByBackdrop: false
  });

  confirmDialog = createDialog({
    selector: '.dialog.confirm',
    init: ($el, dialog) => {
      $el.find('button.yes').on('click', () => {
        if (dialog.onConfirm) {
          dialog.onConfirm();
        }
      });
      dialog.setText = text => $el.find('.text').html(text)
    }
  });
}

function createDialog(options) {
  options = $.extend({
    closeByEsc: true, closeByBackdrop: true, init: $.noop
  }, options);

  const $el = $(options.selector);
  $el.on('click', event => {
    const $target = $(event.target);
    if (
      $target.closest('.dialog-close').length ||
      (options.closeByBackdrop && !$target.closest('.dialog-box').length)
    ) {
      $el.get(0).close();
    }
  });
  $el.on('cancel', event => {
    if (!options.closeByEsc) {
      event.preventDefault();
    }
  });

  const dialog = {
    open: () => {
      $('dialog[open]').each((index, el) => el.close());
      $el.get(0).showModal();
    },
    close: () => $el.get(0).close()
  };

  options.init($el, dialog);

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

function editClick(script, index) {
  console.log(script);
}

function deleteClick(script, index) {
  confirmDialog.open();
  confirmDialog.setText(`Delete script from <b>${script.origin}</b>?`);
  confirmDialog.onConfirm = () => {
    loadingDialog.open();
    createWindow({ url: script.origin, state: 'minimized' }).then(wnd => {
      return executeScript(wnd.tabs[0].id, {
        code: 'delete localStorage["RunJsOnPageStart"]'
      }).then(() => wnd);
    }).then(wnd => {
      return removeWindow(wnd.id);
    }).then(() => {
      scripts.splice(index, 1);
      return setToLocalStorage({ scripts });
    }).then(() => {
      loadingDialog.close();
    });
  };
}

init();
