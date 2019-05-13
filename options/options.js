const tableBody = document.querySelector('.scripts tbody');
const rowTpl = document.querySelector('#row-tpl');
const emptyTpl = document.querySelector('#empty-tpl');

function renderScripts(scripts) {
  scripts = scripts || [];
  tableBody.innerHTML = '';
  
  if (!scripts.length) {
    tableBody.appendChild(
      document.importNode(emptyTpl.content, true)
    );
    return;
  }
  
  scripts.forEach(script => {
    const row = document.importNode(rowTpl.content, true);
    let el;

    el = row.querySelector('.origin a');
    el.textContent = el.href = script.origin;

    el = row.querySelector('.code pre');
    el.textContent = script.code;

    el = row.querySelector('.created');
    el.textContent = new Date(script.createdAt).toLocaleString();

    el = row.querySelector('.updated');
    el.textContent = new Date(script.updatedAt).toLocaleString();
    
    el = row.querySelector('.delete');
    el.addEventListener('click', () => {
      if (confirm('Are you sure?')) {
        scripts.splice(scripts.indexOf(script), 1);
        chrome.storage.local.set({ scripts });
      }
    });

    tableBody.appendChild(row);
  });
}

chrome.storage.local.get(['scripts'], data => renderScripts(data.scripts));
chrome.storage.local.onChanged.addListener(data => renderScripts(data.scripts.newValue));
