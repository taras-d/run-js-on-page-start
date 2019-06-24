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
export const executeScript = toPromise(chrome.tabs, 'executeScript');
export const reloadTab = toPromise(chrome.tabs, 'reload');
