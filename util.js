function toPromise(context, method) {
  return (...args) => {
    return new Promise((resolve, reject) => {
      context[method](...args, res => {
        chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve(res);
      });
    });
  };
}

export const setToLocalStorage = toPromise(chrome.storage.local, 'set');
export const getFromLocalStorage = toPromise(chrome.storage.local, 'get');
export const getSelectedTab = toPromise(chrome.tabs, 'getSelected');
export const executeScript = toPromise(chrome.tabs, 'executeScript');
export const reloadTab = toPromise(chrome.tabs, 'reload');
export const createWindow = toPromise(chrome.windows, 'create');
export const removeWindow = toPromise(chrome.windows, 'remove');

export function formatDate(date) {
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

export function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        resolve( JSON.parse(reader.result) );
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function createDialog(options) {
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

export const infoDialog = createDialog({
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
