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

export function createElement(config) {
  const el = document.createElement(config.tag);
  el.className = config.className || '';
  el.title = config.title || '';
  el.textContent = config.text || '';

  Object.assign(el.style, config.style);

  if (config.on) {
    for (let name in config.on) {
      el.addEventListener(name, config.on[name]);
    }
  }

  return el;
}
