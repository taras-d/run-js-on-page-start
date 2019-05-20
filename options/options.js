const tableBody = $('.table tbody');

let scripts;

function scriptsLoaded(res) {
  scripts = res || [];
  renderScripts();
}

function renderScripts() {
  tableBody.empty();
  if (scripts.length) {
    scripts.forEach(script => {
      tableBody.append(createTableRow(script));
    })
  } else {
    tableBody.append(
      $('<tr>').append(
        $('<td>', {
          text: 'no data',
          class: 'empty',
          attr: { colspan: 5 }
        })
      )
    );
  }
}

function formatDate(date) {
  date = new Date(date);
  return [
    date.getDate(), '.', date.getMonth() + 1, '.', date.getFullYear(), ' ',
    date.getHours(), ':', date.getMinutes(), ':', date.getMilliseconds()
  ].map(part => {
    if (typeof part === 'number') {
      return part < 10 ? `0${part}` : `${part}`;
    } else {
      return part;
    }
  }).join('');
}

function createTableRow(script, index) {
  return $('<tr>').append(
    $('<td>').append(
      $('<a>', {
        class: 'link',
        href: script.origin,
        text: script.origin,
        target: '_blank'
      })
    ),
    $('<td>', {
      class: 'code'
    }).append(
      $('<pre>', {
        text: script.code
      })
    ),
    $('<td>', {
      class: 'date',
      text: formatDate(script.createdAt)
    }),
    $('<td>', {
      class: 'date',
      text: formatDate(script.updatedAt)
    }),
    $('<td>', {
      class: 'actions'
    }).append(
      $('<a>', {
        class: 'link',
        text: 'edit',
        on: { click: () => editClick(script, index) }
      }),
      $('<a>', {
        class: 'link',
        text: 'delete',
        on: { click: () => deleteClick(script, index) }
      })
    )
  );
}

function editClick(script, index) {
  console.log(script);
}

function deleteClick(script, index) {
  if (confirm('Are you sure?')) {
    scripts.splice(index, 1);
    chrome.storage.local.set({ scripts });
  }
}

chrome.storage.local.get(['scripts'], data => scriptsLoaded(data.scripts));
chrome.storage.local.onChanged.addListener(data => {
  if ('scripts' in data) {
    scriptsLoaded(data.scripts.newValue)
  }
});
