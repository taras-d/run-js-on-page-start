const storageKey = 'RunJsOnPageStart';

chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === 'apply') {
    const settings = msg.data;
    if (settings.enabled) {
      localStorage[storageKey] = settings.code;
    } else {
      delete localStorage[storageKey];
    }
    window.location.reload();
  }
});

if (localStorage[storageKey]) {
  const el = document.createElement('script');
  el.text = localStorage[storageKey];
  document.documentElement.appendChild(el);
}
