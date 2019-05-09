const code = localStorage['RunJsOnPageStart'];
if (code) {
  const el = document.createElement('script');
  el.text = code;
  document.documentElement.appendChild(el);
}
