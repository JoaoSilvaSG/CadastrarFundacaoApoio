const apiBase = '/api/fundacoes';

function byId(id) { return document.getElementById(id); }
const form = byId('form');
const table = byId('table');
const tbody = table.querySelector('tbody');

let allFundacoes = [];

function showMessage(text, type = 'success') {
  const toast = document.getElementById("toast");
  toast.textContent = text;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.className = "toast";
  }, 6000);
}

function clearForm() {
  byId('nome').value = '';
  byId('cnpj').value = '';
  byId('email').value = '';
  byId('telefone').value = '';
  byId('instituicao').value = '';
  byId('editingId').value = '';

  const cancelBtn = byId('cancelEditBtn');
  if (cancelBtn) cancelBtn.style.display = "none";
}

function formatCNPJ(cnpj) {
  if (!cnpj) return '';
  cnpj = String(cnpj).replace(/\D/g, '');
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function itemMatchesTerm(item, term) {
  if (!term) return false;
  const raw = term.toLowerCase().trim();
  const digitsTerm = raw.replace(/\D/g, '');

  const nome = (item.nome || '').toLowerCase();
  const email = (item.email || '').toLowerCase();
  const instituicao = (item.instituicao || '').toLowerCase();
  const cnpjRaw = String(item.cnpj || '').replace(/\D/g, '');
  const telefoneRaw = String(item.telefone || '').replace(/\D/g, '');

  if (digitsTerm.length > 0) {
    if (cnpjRaw.includes(digitsTerm)) return true;
    if (telefoneRaw.includes(digitsTerm)) return true;
  }

  if (nome.includes(raw) || email.includes(raw) || instituicao.includes(raw)) return true;

  const formattedCnpj = formatCNPJ(item.cnpj || '').toLowerCase();
  if (formattedCnpj.includes(raw)) return true;

  return false;
}

function renderList(items, searchTerm = '') {
  tbody.innerHTML = '';

  if (!items || !items.length) {
    table.style.display = 'none';

    let noResults = document.getElementById("noResults");
    if (!noResults) {
      noResults = document.createElement("div");
      noResults.id = "noResults";
      noResults.style.marginTop = "16px";
      noResults.style.textAlign = "center";
      noResults.style.fontStyle = "italic";
      noResults.style.color = "#666";
      table.parentNode.appendChild(noResults);
    }

    if (searchTerm) {
      noResults.textContent = "Nenhum registro encontrado na busca.";
    } else {
      noResults.textContent = "Nenhum registro cadastrado.";
    }
    return;
  } else {
    table.style.display = '';
    const noResults = document.getElementById("noResults");
    if (noResults) noResults.remove();
  }

  items.forEach(it => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${it.nome || ''}</td>
      <td>${formatCNPJ(it.cnpj)}</td>
      <td>${it.email || ''}</td>
      <td>${it.telefone || ''}</td>
      <td>${it.instituicao || ''}</td>
      <td class="actions">
        <button data-id="${it.id}" class="edit">Editar</button>
        <button data-id="${it.id}" class="del">Excluir</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.edit').forEach(b => b.onclick = async (e) => {
    const id = e.target.dataset.id;
    const item = allFundacoes.find(x => String(x.id) === String(id));
    if (item) {
      byId('nome').value = item.nome || '';
      byId('cnpj').value = item.cnpj || '';
      byId('email').value = item.email || '';
      byId('telefone').value = item.telefone || '';
      byId('instituicao').value = item.instituicao || '';
      byId('editingId').value = item.id;
      byId('cancelEditBtn').style.display = "inline-block";
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  tbody.querySelectorAll('.del').forEach(b => b.onclick = async (e) => {
    if (!confirm('Confirma exclusão?')) return;
    const id = e.target.dataset.id;
    const resp = await fetch(`${apiBase}/${id}`, { method: 'DELETE' });
    const json = await resp.json();
    if (resp.ok) {
      showMessage(json.message || 'Excluído');
      listAll();
    } else {
      showMessage(json.error || 'Erro', 'error');
    }
  });
}

const cancelBtn = byId('cancelEditBtn');
if (cancelBtn) {
  cancelBtn.addEventListener('click', () => {
    clearForm();
    cancelBtn.style.display = "none";
  });
}

async function listAll() {
  const resp = await fetch(apiBase);
  const json = await resp.json();
  if (resp.ok) {
    allFundacoes = json.data || [];
    renderList(allFundacoes);
  } else {
    showMessage(json.error || 'Erro ao listar', 'error');
  }
}

form.onsubmit = async (e) => {
  e.preventDefault();
  const payload = {
    nome: byId('nome').value.trim(),
    cnpj: byId('cnpj').value.trim(),
    email: byId('email').value.trim(),
    telefone: byId('telefone').value.trim(),
    instituicao: byId('instituicao').value.trim()
  };
  const editing = byId('editingId').value;
  try {
    if (editing) {
      const resp = await fetch(`${apiBase}/${editing}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await resp.json();
      if (resp.ok) {
        showMessage(json.message || 'Atualizado com sucesso');
        clearForm();
        listAll();
      } else {
        showMessage(json.error || json.message || 'Erro', 'error');
      }
    } else {
      const resp = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await resp.json();
      if (resp.ok) {
        showMessage(json.message || 'Cadastrado com sucesso');
        clearForm();
        listAll();
      } else {
        showMessage(json.error || json.message || 'Erro', 'error');
      }
    }
  } catch (err) {
    showMessage('Erro de comunicação', 'error');
    console.error(err);
  }
};

function maskCNPJ(input) {
  if (!input) return;
  input.addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");
    value = value.replace(/^(\d{2})(\d)/, "$1.$2");
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    value = value.replace(/\.(\d{3})(\d)/, ".$1/$2");
    value = value.replace(/(\d{4})(\d)/, "$1-$2");
    e.target.value = value.substring(0, 18);
  });
}
function maskTelefone(input) {
  if (!input) return;
  input.addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");

    if (value.length > 11) value = value.substring(0, 11);

    if (value.length > 10) {
      // Celular (11 dígitos)
      value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    } else if (value.length > 6) {
      // Fixo (até 10 dígitos)
      value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3");
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    } else {
      value = value.replace(/^(\d*)/, "($1");
    }

    e.target.value = value;
  });
}

maskCNPJ(byId('cnpj'));
maskTelefone(byId('telefone'));

function filterResults(query) {
  const term = (query || '').toString().trim();
  if (!term) {
    listAll()
    return;
  }
  const results = allFundacoes.filter(f => itemMatchesTerm(f, term));
  renderList(results, term);
}

const searchInput = byId('searchAll');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    filterResults(e.target.value);
  });
}

document.getElementById("searchAll").addEventListener("input", function () {
  const term = this.value.trim().toLowerCase();
  const rows = document.querySelectorAll("#table tbody tr");

  rows.forEach(row => {
    row.style.display = "none";
    row.querySelectorAll("td:not(.actions)").forEach(td => {
      td.innerHTML = td.textContent;

      if (term && td.textContent.toLowerCase().includes(term)) {
        row.style.display = "";

        const regex = new RegExp(`(${term})`, "gi");
        td.innerHTML = td.textContent.replace(regex, `<span class="highlight">$1</span>`);
      }
    });
  });
});

byId('btnListAll') && (byId('btnListAll').onclick = listAll);

// inicializa
listAll();
