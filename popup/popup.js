import {
  getFromLocalStorage,
  setToLocalStorage,
  executeScript,
  reloadTab,
  createElement
} from '../util.js';

const injectKey = 'RunJsOnPageStart'; 
const scriptListPanel = document.querySelector('.panel.script-list');
const scriptEditPanel = document.querySelector('.panel.script-edit');

let editor;
let scripts = [];
let currentScript;

function init() {
  document.querySelectorAll('.panel-header .actions .link').forEach(el => {
    el.addEventListener('click', headerActionClick);
  });

  scriptListPanel.querySelector('.panel-footer .remove-injected')
    .addEventListener('click', removeInjectedScript);

  getFromLocalStorage(['scripts']).then(data => {
    scripts = data.scripts || [];
    renderScripts();
  });

  updateStatus();
}

function headerActionClick(e) {
  switch (e.target.name) {
    case 'add':
      editScript(null);
      break;

    case 'back':
      openPanel('script-list');
      currentScript = null;
      break;

    case 'inject':
      saveCurrentScript(true);
      break;

    case 'save':
      saveCurrentScript();
      break;
  }
}

function updateStatus() {
  executeScript({ code: `'${injectKey}' in localStorage` }).then(res => {
    const status = scriptListPanel.querySelector('.panel-footer .status');
    const removeInjected = scriptListPanel.querySelector('.panel-footer .remove-injected');
    if (res[0]) {
      status.classList.add('hidden');
      removeInjected.classList.remove('hidden');
    } else {
      status.textContent = 'Script is not injected';
    }
  });
}

function openPanel(className) {
  document.querySelectorAll('.panel').forEach(el => {
    el.classList.toggle('hidden', !el.classList.contains(className));
  });
}

function editScript(script) {
  openPanel('script-edit');

  currentScript = script || { name: '', code: '' };
  currentScript.name = currentScript.name || '';
  currentScript.code = currentScript.code || '';

  const headerName = scriptEditPanel.querySelector('.panel-header .name');
  headerName.textContent = `${script? 'Edit': 'Add'} script`;

  const scriptName = scriptEditPanel.querySelector('.panel-body .name');
  scriptName.value = currentScript.name;

  if (!editor) {
    editor = ace.edit(scriptEditPanel.querySelector('.code'));
    editor.setOptions({
      theme: 'ace/theme/chrome',
      mode: 'ace/mode/javascript',
      fontSize: 11,
      tabSize: 2,
      useSoftTabs: true
    });
  }

  editor.setValue(currentScript.code);
  editor.selection.clearSelection();
}

function saveCurrentScript(inject) {
  currentScript.name = scriptEditPanel.querySelector('.panel-body .name').value;
  currentScript.code = editor.getValue();

  if (!currentScript.name.trim()) {
    currentScript.name = getDefaultScriptName();
  }

  if (!scripts.includes(currentScript)) {
    scripts.unshift(currentScript);
  }

  setToLocalStorage({ scripts }).then(() => {
    if (inject) {
      return injectScript(currentScript);
    }

    currentScript = null;
    openPanel('script-list');
    renderScripts();
  });
}

function renderScripts() {
  const body = scriptListPanel.querySelector('.panel-body');
  body.innerHTML = '';

  if (scripts.length) {
    const ul = createElement({ tag: 'ul' });
    scripts.forEach((script, index) => {
      ul.appendChild(getScriptItem(script, index));
    });
    body.appendChild(ul);
  } else {
    body.appendChild(
      createElement({ tag: 'div', className: 'empty', text: 'no scripts' })
    );
  }
}

function getScriptItem(script) {
  const li = createElement({
    tag: 'li',
    on: { click: () => editScript(script) }
  });

  li.appendChild(
    createElement({
      tag: 'span', className: 'name',
      text: script.name, title: script.name
    })
  );
  
  const actions = createElement({ tag: 'span', className: 'actions' });
  actions.appendChild(
    createElement({
      tag: 'a', className: 'link', text: 'inject',
      title: 'Save changes, inject script and reload tab',
      on: {
        click: e => {
          e.stopPropagation();
          injectScript(script);
        }
      }
    })
  );
  actions.appendChild(
    createElement({
      tag: 'a', className: 'link', text: 'delete', title: 'Delete script',
      on: {
        click: e => {
          e.stopPropagation();
          deleteScript(script);
        }
      }
    })
  );
  li.appendChild(actions);

  return li;
}

function injectScript(script) {
  executeScript({
    code: `localStorage['${injectKey}'] = ${JSON.stringify(script.code)}`
  }).then(() => {
    return reloadTab();
  }).then(() => {
    window.close();
  })
}

function deleteScript(script) {
  scripts.splice(scripts.indexOf(script), 1);
  renderScripts();
  setToLocalStorage({ scripts });
}

function getDefaultScriptName() {
  const nums = scripts.map(script => {
    const res = (script.name || '').match(/^script(\d+)$/i);
    return res && res[1] ? +res[1]: '';
  }).filter(num => num);
  return `Script${Math.max(0, ...nums) + 1}`;
}

function removeInjectedScript() {
  executeScript({
    code: `delete localStorage['${injectKey}']`
  }).then(() => {
    return reloadTab();
  }).then(() => {
    window.close();
  });
}

init();
