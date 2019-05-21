import {
  getFromLocalStorage,
  setToLocalStorage,
  createWindow,
  removeWindow,
  executeScript
} from '../util.js';

let $tBody;
let loadingDialog;
let deleteDialog;
let scripts;

function init() {
  $tBody = $('.table tbody');

  loadingDialog = createDialog({
    selector: '.dialog.loading', closeEsc: false, closeBackdrop: false
  });

  deleteDialog = createDialog({
    selector: '.dialog.delete'
  });

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

function createDialog(options) {
  options = $.extend({
    closeEsc: true, closeBackdrop: true
  }, options);

  const $el = $(options.selector);

  $el.on('click', event => {
    const target = $(event.target);
    if (
      target.closest('.dialog-close').length ||
      (options.closeBackdrop && !target.closest('.dialog-box').length)
    ) {
      $el[0].close();
    }
  });

  $el.on('cancel', event => {
    if (!options.closeEsc) {
      event.preventDefault();
    }
  });

  return {
    $el,
    open: () => {
      $('dialog[open]').each((index, el) => el.close());
      $el[0].showModal();
    },
    close: () => $el[0].close()
  };
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
          text: 'no data',
          class: 'empty',
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
        class: 'link',
        href: script.origin,
        text: script.origin,
        target: '_blank'
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
        class: 'link',
        text: 'edit',
        on: { click: () => editClick(script, index) }
      }),
      $('<a>', {
        class: 'link',
        text: 'delete',
        on: { click: () => deleteClick(script, index) }
      })
    )
  );
}

function formatDate(date) {
  date = new Date(date);
  return [
    date.getDate(), '.', date.getMonth() + 1, '.', date.getFullYear(), ' ',
    date.getHours(), ':', date.getMinutes()
  ].map(part => {
    if (typeof part === 'number') {
      return part < 10 ? `0${part}` : `${part}`;
    } else {
      return part;
    }
  }).join('');
}

function editClick(script, index) {
  console.log(script);
}

function deleteClick(script, index) {
  deleteDialog.open();
  deleteDialog.$el.find('.message').html(`Delete script <b>${script.origin}</b>?`);
  deleteDialog.$el.find('button.yes').off('click').on('click', () => {
    loadingDialog.open();
    let wnd;
    createWindow({ url: script.origin, state: 'minimized' }).then(res => {
      wnd = res;
      return executeScript(wnd.tabs[0].id, { code: 'delete localStorage["RunJsOnPageStart"]' });
    }).then(() => {
      return removeWindow(wnd.id);
    }).then(() => {
      scripts.splice(index, 1);
      return setToLocalStorage({ scripts });
    }).then(() => {
      loadingDialog.close();
    });
  });
}

init();
