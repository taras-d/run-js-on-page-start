const scriptListEl = document.querySelector('.section.script-list');
      const scriptEditEl = document.querySelector('.section.script-edit');

      let editor;
      let scripts = [];
      let currentScript;

      function init() {
        document.querySelectorAll('.section-header .actions .link').forEach(el => {
          el.addEventListener('click', headerActionClick);
        });

        loadScripts();
      }

      function loadScripts() {
        // To do - get from local storage
        renderScripts();
      }

      function headerActionClick(e) {
        switch (e.target.name) {
          case 'add':
            editScript(null);
            break;

          case 'cancel':
            openSection('script-list');
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

      function openSection(className) {
        document.querySelectorAll('.section').forEach(el => {
          el.classList.toggle('hidden', !el.classList.contains(className));
        });
      }

      function editScript(script) {
        openSection('script-edit');

        currentScript = script || { name: '', code: '' };

        const headerName = scriptEditEl.querySelector('.section-header .name');
        headerName.textContent = `${script? 'Edit': 'Add'} script`;

        const scriptName = scriptEditEl.querySelector('.section-body .name');
        scriptName.value = currentScript.name;

        if (!editor) {
          editor = ace.edit(scriptEditEl.querySelector('.code'));
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
        currentScript.name = scriptEditEl.querySelector('.section-body .name').value;
        currentScript.code = editor.getValue();

        if (!currentScript.name.trim()) {
          currentScript.name = getTempName();
        }

        if (!scripts.includes(currentScript)) {
          scripts.unshift(currentScript);
        }

        // To do - save to local storage

        if (inject) {
          injectScript(currentScript);
        } else {
          currentScript = null;
          openSection('script-list');
          renderScripts();
        }
      }

      function createElement(config) {
        const el = document.createElement(config.tag);
        el.className = config.className;
        el.title = config.title;
        el.textContent = config.text;
        if (config.onClick) {
          el.addEventListener('click', config.onClick);
        }
        return el;
      }

      function renderScripts() {
        const listEl = scriptListEl.querySelector('ul');
        listEl.innerHTML = '';

        if (scripts.length) {
          scripts.forEach((script, index) => {
            listEl.appendChild(getScriptItem(script, index));
          });
        } else {
          listEl.appendChild(
            createElement({ tag: 'li', className: 'empty', text: 'No scripts' })
          );
        }
      }

      function getScriptItem(script) {
        const li = createElement({ tag: 'li' });

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
            onClick: () => injectScript(script)
          })
        );
        actions.appendChild(
          createElement({
            tag: 'a', className: 'link', text: 'edit',
            onClick: () => editScript(script)
          })
        );
        actions.appendChild(
          createElement({
            tag: 'a', className: 'link', text: 'delete',
            onClick: () => deleteScript(script)
          })
        );
        li.appendChild(actions);

        return li;
      }

      function injectScript(script) {
        console.log(script);
      }

      function deleteScript(script) {
        scripts.splice(scripts.indexOf(script), 1);
        renderScripts();
      }

      function getTempName() {
        const nums = [];
        scripts.forEach(script => {
          const res = (script.name || '').match(/^script #(\d+)$/i);
          if (res && res[1]) {
            nums.push(+res[1]);
          }
        });
        const nextNum = nums.length? Math.max(...nums) + 1: 1;
        return `Script #${nextNum}`;
      }

      init();