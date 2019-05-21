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
