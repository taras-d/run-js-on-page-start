function renderScripts(scripts) {
  scripts = scripts || [];

  const tableBody = document.querySelector('.scripts tbody');
  const rowTpl = document.querySelector('#row-tpl');

  tableBody.innerHTML = '';
  
  if (!scripts.length) {

  }
  
  scripts.forEach(script => {
    const row = document.importNode(rowTpl.content, true);
    let el;

    el = row.querySelector('.origin');
    el.textContent = el.href = script.origin;

    el = row.querySelector('.code');
    el.textContent = script.code;

    el = row.querySelector('.created');
    el.textContent = new Date(script.createdAt).toLocaleString();

    el = row.querySelector('.updated');
    el.textContent = new Date(script.updatedAt).toLocaleString();

    tableBody.appendChild(row);
  });
}

chrome.storage.local.get(['scripts'], data => renderScripts(data.scripts));
chrome.storage.local.onChanged.addListener(data => renderScripts(data.scripts.newValue));
