// Configuração inicial
const DEFAULT_ITEMS = [
  "Cristal do Caos",
  "Pena do Condor",
  "Chama do Condor",
  "Despertar",
  "Arcanjo",
];

// Integração com Supabase via Netlify Functions

async function loadState() {
  try {
    console.log('Carregando dados do Supabase...');
    const response = await fetch('/.netlify/functions/supabase-api/check-updates', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.state) {
        console.log('Dados carregados do Supabase');
        return data.state;
      }
    }
    return null;
  } catch (error) {
    console.error('Erro ao carregar dados do Supabase:', error);
    return null;
  }
}

function saveState(state) {
  try {
    // Salvar no localStorage como backup
    localStorage.setItem('guild_state', JSON.stringify(state));
    
    // Sincronizar com Supabase
    syncStateToSupabase(state);
  } catch (error) {
    console.error('Erro ao salvar estado:', error);
  }
}

// Função para sincronizar com Supabase
async function syncStateToSupabase(state) {
  try {
    const response = await fetch('/.netlify/functions/supabase-api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        state: state,
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      console.log('Estado sincronizado com Supabase');
    } else {
      throw new Error('Erro na resposta do servidor');
    }
  } catch (error) {
    console.error('Erro ao sincronizar com Supabase:', error);
    showToast('Dados salvos localmente. Sincronização com Supabase falhou.', 'warning');
  }
}





function createEmptyState() {
  return {
    items: [], // Lista vazia - usuário deve adicionar itens manualmente
    players: [], // {name, counts: {item: number}, active?: boolean}
    history: [],
    rotation: {}, // por item: índice do último que recebeu
    ui: { editUnlocked: false },
  };
}

// Inicializar com estado vazio - será carregado do Supabase na função main
let state = createEmptyState();
// Garantir que o estado tenha todas as propriedades necessárias
if (!state.rotation) state.rotation = {};
if (!state.ui) state.ui = { editUnlocked: false };

// Utilidades
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
function fmtDate(d = new Date()) {
  return d.toLocaleString();
}
function showSection(id) {
  const tabs = $$(".nav-tabs .tab");
  const sections = ["#section-dashboard", "#section-distribuir", "#section-cadastros", "#section-historico"];
  for (const sel of sections) $(sel)?.classList.add('hidden');
  $(id)?.classList.remove('hidden');
  tabs.forEach((t)=> t.classList.toggle('active', t.dataset.target === id));
  // sidebar active
  $$("#sidebar .side-link").forEach(b=> b.classList.toggle('active', b.dataset.target===id));
  // breadcrumbs
  const bc = document.getElementById('breadcrumbs');
  if (bc) {
    const label = id === '#section-dashboard' ? 'Dashboard' : id === '#section-distribuir' ? 'Distribuição' : id === '#section-cadastros' ? 'Cadastros' : 'Histórico';
    bc.textContent = `Home / ${label}`;
  }
  if (id === '#section-dashboard') renderDashboard();
  if (id === '#section-cadastros') { renderPlayersManager(); renderItemsManager(); }
}

// Renderização da tabela
function renderTable() {
  const thead = $("#table-head");
  const tbody = $("#table-body");
  thead.innerHTML = "";
  tbody.innerHTML = "";

  const focus = state.ui?.focusItem || "";
  const itemCols = focus ? [focus] : state.items;
  const hasPlayersWithTwoFaults = state.players.some(p => (p.faults || 0) >= 2);
  const columns = ["Participa", "Jogador", ...itemCols, "Total", "Faltas"];
  if (focus || hasPlayersWithTwoFaults) {
    columns.push("Ação");
  }

  const trh = document.createElement("tr");
  for (const col of columns) {
    const th = document.createElement("th");
    th.textContent = col;
    th.dataset.col = col;
    th.style.cursor = "pointer";
    th.title = "Clique para ordenar";
    th.addEventListener("click", () => sortBy(col));
    trh.appendChild(th);
  }
  thead.appendChild(trh);

  const onlyActive = $("#only-active")?.checked;
  const q = (state.ui?.search || '').toLowerCase();
  let playersToShow = (onlyActive ? state.players.filter((p) => p.active !== false) : state.players).slice();
  if (q) playersToShow = playersToShow.filter(p=>p.name.toLowerCase().includes(q));
  if (state.ui?.lockOrder && state.ui?.currentSort) {
    const col = state.ui.currentSort; const asc = !!state.ui.sortAsc; const dir = asc?1:-1;
    playersToShow.sort((a,b)=>{
      if (col === "Participa") return ((a.active===false?1:0)-(b.active===false?1:0))*dir;
      if (col === "Jogador") return a.name.localeCompare(b.name)*dir;
      if (col === "Total") {
        const ta = state.items.reduce((s,i)=>s+(a.counts[i]||0),0);
        const tb = state.items.reduce((s,i)=>s+(b.counts[i]||0),0);
        return (ta-tb)*dir;
      }
      if (col === "Faltas") {
        return ((a.faults||0)-(b.faults||0))*dir;
      }
      return ((a.counts[col]||0)-(b.counts[col]||0))*dir;
    });
  }
  for (const p of playersToShow) {
    const tr = document.createElement("tr");
    tr.draggable = true;
    tr.dataset.name = p.name;
    if (p.active === false) tr.classList.add('inactive');

    // Participa
    const tdActive = document.createElement('td');
    tdActive.className = 'num';
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.checked = p.active !== false;
    chk.addEventListener('change', () => {
      p.active = chk.checked;
      saveState(state); renderTable();
    });
    tdActive.appendChild(chk);
    tr.appendChild(tdActive);

    // Nome
    const tdName = document.createElement("td");
    tdName.textContent = p.name;
    tr.appendChild(tdName);

    // Itens
    let total = 0;
    for (const item of itemCols) {
      const td = document.createElement("td");
      td.className = "num";
      td.dataset.item = item;
      const val = p.counts[item] || 0;
      total += val;
      if (state.ui?.editUnlocked) {
        const input = document.createElement('input');
        input.type = 'number'; input.min = '0'; input.step = '1'; input.value = String(val);
        input.className = 'count-input';
        const commit = () => {
          const n = Math.max(0, parseInt(input.value || '0', 10) || 0);
          p.counts[item] = n; saveState(state); renderTable();
        };
        input.addEventListener('change', commit);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') commit(); });
        td.appendChild(input);
      } else {
        const btn = document.createElement("button");
        btn.className = "cell-btn";
        btn.textContent = String(val);
        btn.title = `Clique: +1 | Shift+Clique: -1 (${item})`;
        btn.addEventListener("click", (ev) => {
          const delta = ev.shiftKey ? -1 : 1;
          p.counts[item] = Math.max(0, (p.counts[item] || 0) + delta);
          saveState(state); renderTable();
        });
        td.appendChild(btn);
      }
      tr.appendChild(td);
    }

    // Total
    const tdTotal = document.createElement("td");
    tdTotal.className = "num";
    const sum = state.items.reduce((s, it) => s + (p.counts[it] || 0), 0);
    tdTotal.textContent = String(sum);
    tr.appendChild(tdTotal);

    // Faltas
    const tdFaults = document.createElement("td");
    tdFaults.className = "num";
    const faults = p.faults || 0;
    
    // Sinalização visual para 2 ou mais faltas
    if (faults >= 2) {
      tdFaults.style.backgroundColor = '#ffebee';
      tdFaults.style.border = '2px solid #f44336';
      tdFaults.title = 'Jogador com 2+ faltas - pode ser movido para o final da fila';
    }
    
    if (state.ui?.editUnlocked) {
      const input = document.createElement('input');
      input.type = 'number'; input.min = '0'; input.step = '1'; input.value = String(faults);
      input.className = 'count-input';
      const commit = () => {
        const n = Math.max(0, parseInt(input.value || '0', 10) || 0);
        p.faults = n; saveState(state); renderTable();
      };
      input.addEventListener('change', commit);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') commit(); });
      tdFaults.appendChild(input);
    } else {
      const btn = document.createElement("button");
      btn.className = "cell-btn";
      btn.textContent = String(faults);
      btn.title = `Clique: +1 falta | Shift+Clique: -1 falta`;
      
      // Adiciona sinalização visual no botão também
      if (faults >= 2) {
        btn.style.backgroundColor = '#f44336';
        btn.style.color = 'white';
        btn.style.fontWeight = 'bold';
      }
      
      btn.addEventListener("click", (ev) => {
        const delta = ev.shiftKey ? -1 : 1;
        p.faults = Math.max(0, (p.faults || 0) + delta);
        saveState(state); renderTable();
      });
      tdFaults.appendChild(btn);
    }
    tr.appendChild(tdFaults);
    // Botão para mover para o final da fila (quando tem 2+ faltas)
    if (faults >= 2) {
      const tdMoveToEnd = document.createElement('td');
      tdMoveToEnd.className = 'num';
      const moveBtn = document.createElement('button');
      moveBtn.className = 'cell-btn';
      moveBtn.textContent = '↓ Fim';
      moveBtn.title = 'Mover jogador para o final da fila';
      moveBtn.style.backgroundColor = '#ff9800';
      moveBtn.style.color = 'white';
      moveBtn.style.fontSize = '12px';
      moveBtn.addEventListener('click', () => {
         movePlayerToEnd(p.name);
         showToast(`${p.name} movido para o final da fila e faltas resetadas`);
       });
      tdMoveToEnd.appendChild(moveBtn);
      tr.appendChild(tdMoveToEnd);
    } else if (focus) {
      const tdQuick = document.createElement('td');
      tdQuick.className = 'num';
      const plus = document.createElement('button'); plus.className='cell-btn'; plus.textContent='+1';
      plus.addEventListener('click', ()=>{ p.counts[focus]=(p.counts[focus]||0)+1; saveState(state); renderTable(); showToast(`+1 ${focus} → ${p.name}`); });
      tdQuick.appendChild(plus); tr.appendChild(tdQuick);
    } else {
      // Adiciona célula vazia para manter alinhamento quando não há foco nem botão de mover
      const tdEmpty = document.createElement('td');
      tr.appendChild(tdEmpty);
    }
    tbody.appendChild(tr);
  }

  // habilita arrastar e soltar para reordenar
  setupRowDragAndDrop(tbody);

  // Atualiza cards-resumo quando a tabela renderiza
  renderSummaryCards();
}

// Ordenação
let sortState = { col: "", asc: true };
function sortBy(col) {
  const asc = sortState.col === col ? !sortState.asc : true;
  sortState = { col, asc };
  if (state.ui?.lockOrder) {
    state.ui.currentSort = col; state.ui.sortAsc = asc; renderTable();
  } else {
    state.players.sort((a, b) => {
      const dir = asc ? 1 : -1;
      if (col === "Participa") return ((a.active===false?1:0) - (b.active===false?1:0)) * dir;
      if (col === "Jogador") return a.name.localeCompare(b.name) * dir;
      if (col === "Total") {
        const ta = state.items.reduce((s, it) => s + (a.counts[it] || 0), 0);
        const tb = state.items.reduce((s, it) => s + (b.counts[it] || 0), 0);
        return (ta - tb) * dir;
      }
      if (col === "Faltas") {
        return ((a.faults || 0) - (b.faults || 0)) * dir;
      }
      // Itens
      return ((a.counts[col] || 0) - (b.counts[col] || 0)) * dir;
    });
    renderTable();
  }
}

// Sugestão de quem recebe (segue ordem sequencial da tabela)
function suggestFor(item, availablePlayers = null, previewMode = false) {
  if (!item) return null;
  
  // Se availablePlayers for fornecido, usar apenas esses jogadores
  const playersToConsider = availablePlayers ? 
    state.players.filter(p => availablePlayers.includes(p.name)) : 
    state.players.filter(p => p.active !== false);
  
  if (playersToConsider.length === 0) return null;
  
  // Manter a ordem original dos jogadores na lista
  const orderedPlayers = state.players.filter(p => 
    playersToConsider.some(pc => pc.name === p.name)
  );
  
  if (orderedPlayers.length === 0) return null;
  
  // Encontrar quem tem menos do item sorteado
  let minQuantity = Infinity;
  orderedPlayers.forEach(player => {
    const quantity = player.counts[item] || 0;
    if (quantity < minQuantity) {
      minQuantity = quantity;
    }
  });
  
  // Filtrar jogadores que têm a menor quantidade do item
  const candidatesWithMinQuantity = orderedPlayers.filter(player => {
    const quantity = player.counts[item] || 0;
    return quantity === minQuantity;
  });
  
  // Pegar o primeiro jogador na ordem da planilha entre os candidatos
  const selectedPlayer = candidatesWithMinQuantity[0];
  
  return selectedPlayer.name;
}

// Gera um plano de distribuição para um lote
function suggestBatch(item, qty, noRepeat = true) {
  return nextNamesEqualize(item, qty, state.rotation[item] ?? -1, noRepeat).names;
}

// Equalização por item: prioriza quem tem menor contagem daquele item.
// Desempate: ordem da lista começando após startIndex.
function nextNamesEqualize(item, qty, startIndex, noRepeat, customPlayers = null) {
  const playersFull = customPlayers || state.players;
  const activeIdx = customPlayers ? 
    playersFull.map((p, i) => i) : // Se customPlayers fornecido, usar todos
    playersFull.map((p, i) => (p.active === false ? -1 : i)).filter((i) => i !== -1);
  const n = activeIdx.length;
  if (n === 0) return { names: [], endIndex: startIndex };
  const maxPicks = noRepeat ? Math.min(qty, n) : qty;
  let cursor = (Number.isInteger(startIndex) ? startIndex : -1);
  const names = [];
  const picked = new Set();
  const counts = new Map(); // idxFull -> count do item
  for (const i of activeIdx) counts.set(i, playersFull[i].counts[item] || 0);

  // ordem sequencial dos índices ATIVOS seguindo a ordem da planilha
  const getSequentialOrder = () => {
    // Retorna os índices ativos na ordem que aparecem na planilha
    return activeIdx.slice().sort((a, b) => a - b);
  };

  for (let step = 0; step < maxPicks; step++) {
    // encontra menor contagem atual
    let min = Infinity;
    for (const i of activeIdx) min = Math.min(min, counts.get(i) || 0);
    // percorre em ordem sequencial até achar o primeiro com contagem == min (e não repetido se for o caso)
    let chosenIdx = -1;
    for (const i of getSequentialOrder()) {
      const name = playersFull[i].name;
      if (noRepeat && picked.has(name)) continue;
      if ((counts.get(i) || 0) === min) { chosenIdx = i; break; }
    }
    if (chosenIdx === -1) break; // sem candidatos
    const name = playersFull[chosenIdx].name;
    names.push(name);
    picked.add(name);
    counts.set(chosenIdx, (counts.get(chosenIdx) || 0) + 1);
    cursor = chosenIdx; // ponteiro fica no último escolhido
  }
  return { names, endIndex: cursor };
}

// Multi-itens: retorna [{item,name} ...] seguindo a regra por item
function suggestBatchMulti(pairs, noRepeatPerItem) {
  const result = [];
  const cursor = {};
  for (const { item, qty } of pairs) {
    const start = cursor[item] ?? (state.rotation[item] ?? -1);
    const { names, endIndex } = nextNamesEqualize(item, Math.max(1, qty), start, noRepeatPerItem);
    cursor[item] = endIndex;
    for (const n of names) result.push({ item, name: n });
  }
  return result;
}

function renderItemsSelect() {
  // Renderiza as linhas de seleção de itens (múltiplas)
  const rows = $("#item-rows");
  if (!rows) return; // Elemento não existe mais na nova interface
  const makeSelect = (value) => {
    const sel = document.createElement("select");
    for (const it of state.items) {
      const opt = document.createElement("option");
      opt.value = it; opt.textContent = it; sel.appendChild(opt);
    }
    if (value) sel.value = value;
    return sel;
  };

  function newRow(defaultItem = state.items[0], qty = 1) {
    const row = document.createElement("div");
    row.className = "item-row";
    const sel = makeSelect(defaultItem);
    const q = document.createElement("input");
    q.type = "number"; q.min = "1"; q.step = "1"; q.value = String(qty);
    q.title = "Quantidade";
    const rm = document.createElement("button");
    rm.type = "button"; rm.textContent = "×"; rm.className = "remove";
    rm.title = "Remover item";
    rm.addEventListener("click", () => { row.remove(); updateButtons(); });
    row.appendChild(sel); row.appendChild(q); row.appendChild(rm);
    return row;
  }

  // Se não houver linha ainda, cria uma padrão
  if (!rows.dataset.inited) {
    rows.dataset.inited = "1";
    rows.appendChild(newRow());
    $("#btn-add-row").addEventListener("click", () => {
      rows.appendChild(newRow()); updateButtons();
    });
  }

  function updateButtons() {
    const hasRows = rows.children.length > 0;
    $("#btn-suggest").disabled = !hasRows;
  }
  updateButtons();

  // Atualiza opções dos selects existentes para refletir itens atuais
  for (const sel of rows.querySelectorAll("select")) {
    const current = sel.value;
    sel.innerHTML = state.items.map((i) => `<option value="${i}">${i}</option>`).join("");
    if (state.items.includes(current)) sel.value = current; else sel.value = state.items[0];
  }
}

// Gerenciador de Itens (renomear/remover)
function renderItemsManager() {
  const wrap = document.getElementById('items-manager');
  if (!wrap) return;
  const rows = state.items.map((name, idx) => {
    return `
      <div class="item-row">
        <input class="item-name" data-old="${name}" value="${name}" />
        <button class="secondary btn-save" data-old="${name}">Salvar nome</button>
        <button class="danger btn-remove" data-name="${name}">Remover</button>
      </div>
    `;
  }).join("");
  wrap.innerHTML = rows || '<em>Nenhum item cadastrado.</em>';

  wrap.querySelectorAll('.btn-save').forEach(btn => {
    btn.addEventListener('click', () => {
      const oldName = btn.dataset.old;
      const input = wrap.querySelector(`input.item-name[data-old="${CSS.escape(oldName)}"]`);
      if (!input) return;
      const newName = input.value.trim();
      if (!newName || newName === oldName) return;
      renameItem(oldName, newName);
    });
  });
  wrap.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      if (!confirm(`Remover o item "${name}"? Isso não apaga o histórico.`)) return;
      removeItem(name);
    });
  });
}

// Gerenciador de Jogadores (lista simples com editar/excluir)
function renderPlayersManager() {
  const wrap = document.getElementById('players-manager');
  if (!wrap) return;
  

  
  wrap.innerHTML = state.players.map(p => `
    <div class="row" data-name="${p.name}" style="border-left: 4px solid #4caf50; margin-bottom: 10px; padding: 10px;">
      <div class="player-info">
        <span class="name" style="font-weight: bold; font-size: 16px;">${p.name}</span>
        <div class="player-meta" style="font-size: 12px; color: #666; margin-top: 5px;">
          <div>📅 Cadastrado: ${p.createdAt || 'Data não disponível'}</div>
        </div>
      </div>
      <span class="actions">
        <button class="secondary btn-edit">✏️ Editar</button>
        <button class="danger btn-delete">🗑️ Excluir</button>
      </span>
    </div>
  `).join("");
  
  wrap.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.row');
      const oldName = row?.dataset.name;
      const newName = prompt('Novo nome do jogador:', oldName || '');
      if (!newName || newName === oldName) return;
      renamePlayer(oldName, newName);
    });
  });
  
  wrap.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.row');
      const name = row?.dataset.name;
      if (!name) return;
      if (!confirm(`Excluir jogador "${name}"?`)) return;
      deletePlayer(name);
    });
  });
}

function renamePlayer(oldName, newName) {
  const p = state.players.find(x=>x.name===oldName);
  if (!p) return;
  if (state.players.some(x=>x.name.toLowerCase()===newName.toLowerCase())) { alert('Nome já existe.'); return; }
  p.name = newName;
  // Atualiza histórico
  for (const h of state.history) if (h.player === oldName) h.player = newName;
  saveState(state);
  renderPlayersManager();
  renderTable();
  renderHistory();
}

function deletePlayer(name) {
  const idx = state.players.findIndex(p=>p.name===name);
  if (idx<0) return;
  state.players.splice(idx,1);
  // Recalcula rotação por item devido à mudança de índices
  const order = state.players.map(p=>p.name);
  for (const item of Object.keys(state.rotation||{})) {
    const lastName = order[state.rotation[item]]; // aproximação: pode ficar incorreto; recalcula pelo histórico
    const lastFromHistory = [...state.history].reverse().find(h=>h.item===item)?.player;
    const ref = lastFromHistory || lastName;
    state.rotation[item] = ref ? order.indexOf(ref) : -1;
  }
  saveState(state);
  renderPlayersManager();
  renderTable();
}

function addItem(name) {
  const n = name.trim();
  if (!n) return alert('Informe um nome.');
  if (state.items.includes(n)) return alert('Já existe um item com esse nome.');
  state.items.push(n);
  for (const p of state.players) p.counts[n] = p.counts[n] || 0;
  saveState(state);
  renderItemsSelect();
  renderItemsManager();
  renderTable();
  initFocusControls(); initQueuePanel(); renderQueuePanel();
}

function renameItem(oldName, newName) {
  if (state.items.includes(newName)) return alert('Já existe um item com esse nome.');
  const i = state.items.indexOf(oldName);
  if (i < 0) return;
  state.items[i] = newName;
  // migrar contagens
  for (const p of state.players) {
    const val = p.counts[oldName] || 0;
    if (typeof p.counts[newName] === 'undefined') p.counts[newName] = 0;
    p.counts[newName] += val;
    delete p.counts[oldName];
  }
  // rotação
  state.rotation[newName] = state.rotation[oldName] ?? -1;
  delete state.rotation[oldName];
  // histórico
  for (const h of state.history) if (h.item === oldName) h.item = newName;

  saveState(state);
  renderItemsSelect();
  renderPlayersManager();
  renderItemsManager();
  renderTable();
  renderHistory();
  initFocusControls(); initQueuePanel(); renderQueuePanel();
}

function removeItem(name) {
  const i = state.items.indexOf(name);
  if (i < 0) return;
  state.items.splice(i, 1);
  for (const p of state.players) delete p.counts[name];
  delete state.rotation[name];
  // histórico mantido para registro
  saveState(state);
  renderItemsSelect();
  renderItemsManager();
  renderTable();
  initFocusControls(); initQueuePanel(); renderQueuePanel();
}

function renderHistory() {
  const body = document.getElementById('history-body');
  if (!body) return;
  body.innerHTML = state.history
    .slice()
    .reverse()
    .map((h, index) => {
      const originalIndex = state.history.length - 1 - index;
      return `<tr>
        <td>${h.date}</td>
        <td>${h.player}</td>
        <td>${h.item}</td>
        <td class="num">${h.qty||1}</td>
        <td><button class="danger btn-delete-history" data-index="${originalIndex}" title="Excluir esta distribuição">🗑️</button></td>
      </tr>`;
    })
    .join("");
    
  // Adicionar event listeners para os botões de excluir
  body.querySelectorAll('.btn-delete-history').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      deleteHistoryEntry(index);
    });
  });
}

// Função para excluir uma entrada específica do histórico
function deleteHistoryEntry(index) {
  if (index < 0 || index >= state.history.length) return;
  
  const entry = state.history[index];
  if (!confirm(`Excluir distribuição: ${entry.item} para ${entry.player} em ${entry.date}?`)) return;
  
  // Reverter contadores do jogador
  const player = state.players.find(p => p.name === entry.player);
  if (player && player.counts) {
    const currentCount = player.counts[entry.item] || 0;
    const qtyToRemove = entry.qty || 1;
    player.counts[entry.item] = Math.max(0, currentCount - qtyToRemove);
  }
  
  // Remover entrada do histórico
  state.history.splice(index, 1);
  
  // Recalcular rotação baseada no histórico restante
  const order = state.players.map(p => p.name);
  const lastByItem = new Map();
  for (const h of state.history) {
    lastByItem.set(h.item, h.player);
  }
  for (const item of Object.keys(state.rotation || {})) {
    const lastPlayer = lastByItem.get(item);
    state.rotation[item] = lastPlayer ? order.indexOf(lastPlayer) : -1;
  }
  
  saveState(state);
  renderTable();
  renderHistory();
  showToast('Distribuição excluída com sucesso');
}

// Cards-resumo por item
function renderSummaryCards() {
  const container = document.getElementById('dash-stats');
  if (!container) return;
  const cards = state.items.map((item) => {
    let total = 0, min = Infinity, max = -Infinity;
    for (const p of state.players) {
      const v = p.counts[item] || 0;
      total += v; min = Math.min(min, v); max = Math.max(max, v);
    }
    if (min === Infinity) min = 0; if (max === -Infinity) max = 0;
    const gap = max - min;
    return `<div class="summary-card"><div class="title">${item}</div><div class="value">${total}</div><div class="meta">mín: ${min} · máx: ${max} · gap: ${gap}</div></div>`;
  }).join("");
  container.innerHTML = cards || '';
}

// Renderiza o dashboard principal
function renderDashboard() {
  renderSummaryCards();
  renderRankingByItems();
}

// Renderiza ranking de jogadores por item
// Estado para controlar expansão dos rankings (global para todos os itens)
let allRankingsExpanded = false;

function renderRankingByItems() {
  const container = document.getElementById('ranking-container');
  if (!container) return;
  
  const itemRankings = state.items.map(item => {
    // Cria ranking para cada item
    const playersWithItem = state.players
      .map(player => ({
        name: player.name,
        count: player.counts[item] || 0,
        active: player.active !== false
      }))
      .sort((a, b) => a.count - b.count); // Ordena por quantidade crescente (menor no topo)
    
    return {
      item,
      players: playersWithItem
    };
  });
  
  const html = itemRankings.map((ranking, itemIndex) => {
    const displayLimit = allRankingsExpanded ? ranking.players.length : 8;
    const displayPlayers = ranking.players.slice(0, displayLimit);
    const hasMorePlayers = ranking.players.length > 8;
    
    const playersHtml = displayPlayers.map((player, index) => {
      const position = index + 1;
      const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}º`;
      const activeClass = player.active ? 'active' : 'inactive';
      return `
        <div class="ranking-player ${activeClass}">
          <span class="position">${medal}</span>
          <span class="player-name">${player.name}</span>
          <span class="player-count">${player.count}</span>
        </div>
      `;
    }).join('');
    
    // Mostrar botão apenas no primeiro item se algum item tiver mais de 8 jogadores
    const anyItemHasMore = itemRankings.some(r => r.players.length > 8);
    const showMoreButton = (itemIndex === 0 && anyItemHasMore) ? `
      <button class="show-more-btn" onclick="toggleAllRankingsExpansion()">
        ${allRankingsExpanded ? '📤 Mostrar Menos (Todos os Itens)' : '📥 Mostrar Mais (Todos os Itens)'}
      </button>
    ` : '';
    
    return `
      <div class="item-ranking">
        <h4 class="item-title">${ranking.item}</h4>
        <div class="ranking-list">
          ${playersHtml}
        </div>
        ${showMoreButton}
      </div>
    `;
  }).join('');
  
  container.innerHTML = html;
}

// Função para alternar expansão do ranking
function toggleAllRankingsExpansion() {
  allRankingsExpanded = !allRankingsExpanded;
  renderRankingByItems();
}

// Eventos principais
function setupEvents() {
  $("#add-player-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#player-name").value.trim();
    if (!name) return;
    
    // Validação de nome
    if (name.length < 2) {
      showToast("Nome deve ter pelo menos 2 caracteres", "error");
      return;
    }
    
    if (state.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      showToast("Já existe um jogador com esse nome.", "error");
      return;
    }
    
    // Criar jogador com metadados
    const newPlayer = {
      name,
      counts: {},
      active: true,
      faults: 0,
      createdAt: new Date().toLocaleString('pt-BR'),
      syncedAt: null
    };
    
    state.players.push(newPlayer);
    saveState(state);
    e.target.reset();
    
    // Sincronizar com Supabase
    try {
      const response = await fetch('/.netlify/functions/supabase-api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      });
      
      if (!response.ok) {
        console.error('Erro ao sincronizar jogador com Supabase:', await response.text());
      }
    } catch (error) {
      console.error('Erro ao sincronizar jogador:', error);
    }
    
    renderTable();
    renderPlayersManager();
    showToast(`Jogador "${name}" cadastrado com sucesso!`, "success");
  });

  // Marcar/Desmarcar todos e filtro "Só participantes"
  const btnMarkAll = document.getElementById('btn-mark-all');
  const btnUnmarkAll = document.getElementById('btn-unmark-all');
  const onlyActive = document.getElementById('only-active');
  if (btnMarkAll) btnMarkAll.addEventListener('click', () => { state.players.forEach(p => p.active = true); saveState(state); renderTable(); });
  if (btnUnmarkAll) btnUnmarkAll.addEventListener('click', () => { state.players.forEach(p => p.active = false); saveState(state); renderTable(); });
  if (onlyActive) onlyActive.addEventListener('change', () => renderTable());

  // Tabs de navegação
  // (abas removidas) — apenas sidebar
  // Botão copiar ganhadores
  const btnCopyWinners = document.getElementById('btn-copy-winners');
  if (btnCopyWinners) {
    btnCopyWinners.addEventListener('click', copyWinners);
  }

  // Sidebar navegação
  $$("#sidebar .side-link").forEach(btn => {
    btn.addEventListener('click', () => {
      showSection(btn.dataset.target);
      const anchor = btn.dataset.anchor;
      if (anchor === 'players') document.getElementById('players-manager')?.scrollIntoView({behavior:'smooth'});
      if (anchor === 'items') document.getElementById('items-manager')?.scrollIntoView({behavior:'smooth'});
    });
  });

  // Itens: adicionar
  const addItemForm = document.getElementById('add-item-form');
  if (addItemForm) addItemForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    addItem(document.getElementById('item-name').value||'');
    addItemForm.reset();
  });

  // Busca rápida no header
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.addEventListener('input', () => {
    state.ui = state.ui || {}; state.ui.search = searchInput.value.trim().toLowerCase();
    renderTable();
  });

  const btnSuggest = $("#btn-suggest");
  if (btnSuggest) {
    btnSuggest.addEventListener("click", () => {
      const pairs = getPairsFromUI();
      const noRepeat = $("#no-repeat")?.checked || false;
      const plan = suggestBatchMulti(pairs, noRepeatPerItem);
      const box = $("#suggestion-list");
      if (!box) return;
      if (!plan.length) {
        box.innerHTML = `<em>Sem jogadores</em>`;
        const btnAssign = $("#btn-assign");
        if (btnAssign) btnAssign.disabled = true;
        clearSuggestionHighlights();
        return;
      }
      box.innerHTML = plan
        .map((a, i) => `<span class="chip">${i + 1}. ${a.item} → ${a.name}</span>`) 
        .join("");
      const btnAssign = $("#btn-assign");
      if (btnAssign) {
        btnAssign.disabled = false;
        btnAssign.dataset.planMulti = JSON.stringify(plan);
      }
      applySuggestionHighlights(plan);
      state.ui.lastPlan = plan; saveState(state);
    });
  }

  const btnAssign = $("#btn-assign");
  if (btnAssign) {
    btnAssign.addEventListener("click", () => {
      const payload = btnAssign.dataset.planMulti;
      if (!payload) return;
      const assignments = JSON.parse(payload); // [{item,name}...]
      if (!assignments?.length) return;
      const agg = new Map(); // key: item|name
      const batchId = (state.lastBatchId || 0) + 1;
      for (const a of assignments) {
        const p = state.players.find((x) => x.name === a.name);
        if (!p) continue;
        p.counts[a.item] = (p.counts[a.item] || 0) + 1;
        const key = `${a.item}|${a.name}`;
        agg.set(key, (agg.get(key) || 0) + 1);
      }
      const date = fmtDate();
      for (const [key, qty] of agg.entries()) {
        const [item, player] = key.split("|");
        state.history.push({ date, player, item, qty, batchId });
      }
      state.lastBatchId = batchId;
      // Atualiza a rotação: último nome entregue para cada item
      const lastByItem = new Map();
      for (const a of assignments) lastByItem.set(a.item, a.name);
      const order = state.players.map((p) => p.name);
      for (const [item, name] of lastByItem.entries()) {
        const idx = order.indexOf(name);
        if (idx >= 0) state.rotation[item] = idx;
      }
      saveState(state);
      const suggestionList = $("#suggestion-list");
      if (suggestionList) suggestionList.innerHTML = "";
      btnAssign.disabled = true;
      delete btnAssign.dataset.planMulti;
      renderTable();
      renderHistory();
      clearSuggestionHighlights();
      showToast('Lote distribuído');
      flashCells(assignments);
    });
  }

  // Desfazer última distribuição
  const btnUndo = document.getElementById('btn-undo');
  if (btnUndo) btnUndo.addEventListener('click', () => undoLastBatch());

  // função global setupRowDragAndDrop já definida no final

  function getPairsFromUI() {
    const rows = $$("#item-rows .item-row");
    const pairs = [];
    for (const r of rows) {
      const sel = r.querySelector("select");
      const qtyEl = r.querySelector('input[type="number"]');
      const item = sel?.value;
      const qty = Math.max(1, parseInt(qtyEl?.value || "1", 10));
      if (item && qty > 0) pairs.push({ item, qty });
    }
    return pairs;
  }

  const btnExportJson = $("#btn-export-json");
   if (btnExportJson) {
     btnExportJson.addEventListener("click", () => {
       const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
       triggerDownload(blob, `guild-loot-${Date.now()}.json`);
     });
   }

  const btnExportCsv = $("#btn-export-csv");
   if (btnExportCsv) {
     btnExportCsv.addEventListener("click", () => {
       const csv = toCSV(state);
       const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
       triggerDownload(blob, `guild-loot-${Date.now()}.csv`);
     });
   }

  const fileInput = $("#file-input");
  if (fileInput) {
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        let imported;
        if (file.name.endsWith(".json")) {
          imported = JSON.parse(text);
        } else {
          imported = fromCSV(text);
        }
        if (!imported || !imported.players) throw new Error("Formato inválido");
        state = imported;
        if (!state.rotation) state.rotation = {};
        saveState(state);
        renderItemsSelect();
        renderTable();
        renderHistory();
        clearSuggestionHighlights();
      } catch (err) {
        alert("Falha ao importar: " + err.message);
      } finally {
        e.target.value = "";
      }
    });
  }

  const btnReset = $("#btn-reset");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      if (!confirm("Tem certeza que deseja resetar os dados?")) return;
      state = createEmptyState();
      saveState(state);
      renderItemsSelect();
      renderTable();
      renderHistory();
      clearSuggestionHighlights();
    });
  }

  // Travar ordem base
  const btnLockOrder = document.getElementById('btn-lock-order');
  if (btnLockOrder) {
    const setLockLabel = () => { btnLockOrder.textContent = state.ui?.lockOrder ? 'Destravar ordem' : 'Travar ordem'; };
    btnLockOrder.addEventListener('click', () => { 
      state.ui.lockOrder = !state.ui.lockOrder; 
      if (!state.ui.lockOrder) { state.ui.currentSort=null; } 
      saveState(state); 
      setLockLabel(); 
    });
    setLockLabel();
  }

  // Foco por item
  initFocusControls();
}

// CSV helpers (tabela plana similar ao screenshot)
function toCSV(state) {
  const headers = ["JOGADOR", ...state.items];
  const rows = [headers.join(",")];
  for (const p of state.players) {
    const cells = [p.name, ...state.items.map((i) => p.counts[i] || 0)];
    rows.push(cells.join(","));
  }
  return rows.join("\n");
}

function fromCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());
  const nameHeader = headers[0];
  const lastHeader = headers[headers.length - 1] || "";
  const hasCp = /cp\s*equip/i.test(lastHeader);
  const itemHeaders = headers.slice(1, hasCp ? -1 : undefined);
  const players = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (!cols[0]) continue;
    const name = cols[0].trim();
    const counts = {};
    itemHeaders.forEach((it, idx) => {
      counts[it] = Number(cols[idx + 1] || 0) || 0;
    });
    players.push({ name, counts });
  }
  return { items: itemHeaders, players, history: [] };
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// Inicialização
// Função initSampleIfEmpty removida - não carrega mais dados de exemplo automaticamente

async function main() {
  // Tema: aplica preferência salva
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') document.body.classList.add('dark');
  const themeSwitch = document.getElementById('theme-switch');
  if (themeSwitch) themeSwitch.checked = document.body.classList.contains('dark');

  // Carregar dados do Supabase
  try {
    const loadedState = await loadState();
    if (loadedState) {
      state = loadedState;
      // Garantir propriedades necessárias após carregar
      if (!state.rotation) state.rotation = {};
      if (!state.ui) state.ui = { editUnlocked: false };
      // Garantir flag active e inicializar faltas
      if (state.players) state.players.forEach((p) => { 
        if (typeof p.active === 'undefined') p.active = true;
        if (typeof p.faults === 'undefined') p.faults = 0;
      });
      console.log('Dados carregados do Supabase');
      showToast('Dados carregados do Supabase!', 'success');
    } else {
      console.log('Usando estado padrão - nenhum dado encontrado no Supabase');
    }
  } catch (error) {
    console.warn('Erro ao carregar dados do Supabase:', error);
    showToast('Erro ao carregar dados. Usando dados padrão.', 'warning');
  }

  renderItemsSelect();
  renderPlayersManager();
  renderItemsManager();
  renderTable();
  renderHistory();
  setupEvents();
  initDistributeModal();
  saveState(state);

  // Inicializar sistema de sincronização em tempo real


  // Listener do tema
  if (themeSwitch) {
    themeSwitch.addEventListener('change', (e) => {
      const dark = e.target.checked;
      document.body.classList.toggle('dark', dark);
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    });
  }

  // Seção inicial: Dashboard
  showSection('#section-dashboard');
}

function initFocusControls() {
  const sel = document.getElementById('focus-select');
  if (!sel) return;
  const opts = ['<option value="">Todos</option>'].concat(state.items.map(i=>`<option value="${i}">${i}</option>`)).join('');
  sel.innerHTML = opts; sel.value = state.ui?.focusItem || '';
  sel.addEventListener('change', ()=>{ state.ui.focusItem = sel.value; saveState(state); renderTable(); });
}



function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container'); if (!c) return;
  const t = document.createElement('div'); 
  t.className = `toast toast-${type}`;
  t.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
    <span class="toast-message">${msg}</span>
  `;
  c.appendChild(t);
  setTimeout(()=>{ t.remove(); }, type === 'error' ? 5000 : 3000);
}




function flashCells(assignments) {
  // marca as células (item, jogador) alteradas
  const map = new Map();
  for (const a of assignments) {
    const key = `${a.item}|${a.name}`;
    map.set(key, true);
  }
  map.forEach((_, key)=>{
    const [item, name] = key.split('|');
    const row = document.querySelector(`#table-body tr[data-name="${CSS.escape(name)}"]`);
    if (!row) return;
    // encontra a célula pelo data-item
    const td = Array.from(row.querySelectorAll('td[data-item]')).find(el=>el.dataset.item===item);
    if (td) { td.classList.add('flash'); setTimeout(()=>td.classList.remove('flash'), 1200); }
  });
}

function clearSuggestionHighlights() {
  $$("#table-body tr.suggested").forEach(tr => tr.classList.remove('suggested'));
  // remove badges anexadas ao nome
  $$("#table-body td[data-has-badge]").forEach(td => { td.querySelector('.badge')?.remove(); td.removeAttribute('data-has-badge'); });
}

function applySuggestionHighlights(plan) {
  clearSuggestionHighlights();
  const counts = new Map();
  for (const a of plan) counts.set(a.name, (counts.get(a.name)||0)+1);
  counts.forEach((qty, name) => {
    const row = document.querySelector(`#table-body tr[data-name="${CSS.escape(name)}"]`);
    if (!row) return;
    row.classList.add('suggested');
    const nameTd = row.children[1];
    if (nameTd) {
      const b = document.createElement('span');
      b.className = 'badge'; b.textContent = `+${qty}`;
      nameTd.appendChild(b); nameTd.setAttribute('data-has-badge','1');
    }
  });
}

// Reordenar jogadores preservando rotação por item
function reorderPlayers(srcName, dstName) {
  const before = state.players.slice();
  const srcIdx = state.players.findIndex(p => p.name === srcName);
  const dstIdx = state.players.findIndex(p => p.name === dstName);
  if (srcIdx < 0 || dstIdx < 0) return;
  const [moved] = state.players.splice(srcIdx, 1);
  state.players.splice(dstIdx, 0, moved);
  // ajustar rotação: traduz índice anterior para nome e, então, novo índice
  const nameAt = (arr, i) => arr[i] ? arr[i].name : null;
  const idxOf = (name) => state.players.findIndex(p => p.name === name);
  if (!state.rotation) state.rotation = {};
  for (const item of Object.keys(state.rotation)) {
    const oldIdx = state.rotation[item];
    if (typeof oldIdx === 'number' && oldIdx >= 0 && oldIdx < before.length) {
      const nm = nameAt(before, oldIdx);
      const ni = idxOf(nm);
      state.rotation[item] = ni >= 0 ? ni : -1;
    }
  }
  saveState(state);
  renderTable();
}

// Move um jogador para o final da fila
function movePlayerToEnd(playerName) {
  const before = state.players.slice();
  const srcIdx = state.players.findIndex(p => p.name === playerName);
  if (srcIdx < 0) return;
  
  // Remove o jogador da posição atual
  const [moved] = state.players.splice(srcIdx, 1);
  // Reseta as faltas do jogador para 0
  moved.faults = 0;
  // Adiciona no final
  state.players.push(moved);
  
  // Ajustar rotação: traduz índice anterior para nome e, então, novo índice
  const nameAt = (arr, i) => arr[i] ? arr[i].name : null;
  const idxOf = (name) => state.players.findIndex(p => p.name === name);
  if (!state.rotation) state.rotation = {};
  for (const item of Object.keys(state.rotation)) {
    const oldIdx = state.rotation[item];
    if (typeof oldIdx === 'number' && oldIdx >= 0 && oldIdx < before.length) {
      const nm = nameAt(before, oldIdx);
      const ni = idxOf(nm);
      state.rotation[item] = ni >= 0 ? ni : -1;
    }
  }
  
  saveState(state);
  renderTable();
}

// Habilita arrastar/soltar nas linhas da tabela
function setupRowDragAndDrop(tbody) {
  let draggedName = null;
  tbody.querySelectorAll('tr[draggable="true"]').forEach((row) => {
    row.addEventListener('dragstart', () => { draggedName = row.dataset.name; });
    row.addEventListener('dragover', (e) => { e.preventDefault(); row.classList.add('drag-over'); });
    row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
    row.addEventListener('drop', (e) => {
      e.preventDefault(); row.classList.remove('drag-over');
      const targetName = row.dataset.name;
      if (!draggedName || draggedName === targetName) return;
      reorderPlayers(draggedName, targetName);
      draggedName = null;
    });
  });
}

// Desfaz o último lote usando batchId (ou último timestamp se ausente)
function undoLastBatch() {
  if (!state.history.length) { alert('Sem histórico para desfazer.'); return; }
  const maxBatch = Math.max(-1, ...state.history.map(h => h.batchId ?? -1));
  let group;
  if (maxBatch >= 0) group = state.history.filter(h => h.batchId === maxBatch);
  else {
    const lastDate = state.history[state.history.length - 1].date;
    group = state.history.filter(h => h.date === lastDate);
  }
  if (!group.length) return;
  // reverte contagens
  for (const h of group) {
    const p = state.players.find(x => x.name === h.player);
    if (!p) continue;
    p.counts[h.item] = Math.max(0, (p.counts[h.item] || 0) - (h.qty || 1));
  }
  // remove do histórico
  state.history = state.history.filter(h => !group.includes(h));
  // recalcula rotação por item com base no histórico restante
  const order = state.players.map(p => p.name);
  const lastByItem = new Map();
  for (const h of state.history) lastByItem.set(h.item, h.player);
  for (const item of Object.keys(state.rotation || {})) {
    const nm = lastByItem.get(item);
    state.rotation[item] = nm ? order.indexOf(nm) : -1;
  }
  saveState(state);
  renderTable();
  renderHistory();
}

// Reset functions for config page
function resetPresences() {
    if (confirm('Tem certeza que deseja resetar todas as presenças? Esta ação não pode ser desfeita.')) {
        state.players.forEach(player => {
            player.active = false;
        });
        saveState(state);
        alert('Presenças resetadas com sucesso!');
        if (typeof renderTable === 'function') renderTable();
    }
}

function resetItems() {
    if (confirm('Tem certeza que deseja resetar todos os itens recebidos? Esta ação não pode ser desfeita.')) {
        state.players.forEach(player => {
            player.counts = {};
        });
        saveState(state);
        alert('Itens resetados com sucesso!');
        if (typeof renderTable === 'function') renderTable();
    }
}

function resetFaults() {
    if (confirm('Tem certeza que deseja resetar todas as faltas? Esta ação não pode ser desfeita.')) {
        state.players.forEach(player => {
            player.faults = 0;
        });
        saveState(state);
        alert('Faltas resetadas com sucesso!');
        if (typeof renderTable === 'function') renderTable();
    }
}

function copyWinners() {
    // Gerar texto dos ganhadores
    const winnersText = generateWinnersText();
    
    // Mostrar modal de prévia
    showWinnersPreviewModal(winnersText);
}

function generateWinnersText() {
    // Obter ganhadores do último sorteio (histórico mais recente)
    const lastWinners = getLastWinners();
    
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
    });
    const timeStr = currentDate.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    let text = `🏆 Ganhadores do último Kundun:\n`;
    
    // Mapear emojis dos itens
    const itemEmojis = {
        'Cristal do Caos': '💎',
        'Pena do Condor': '🪶',
        'Chama do Condor': '🔥',
        'Despertar': '⚡',
        'Arcanjo': '⭐'
    };
    
    if (lastWinners.length > 0) {
        // Agrupar ganhadores por item
        const itemGroups = {};
        lastWinners.forEach(winner => {
            if (!itemGroups[winner.item]) itemGroups[winner.item] = [];
            for (let i = 0; i < winner.qty; i++) {
                itemGroups[winner.item].push(winner.player);
            }
        });
        
        // Adicionar ganhadores
        Object.entries(itemGroups).forEach(([item, players]) => {
            const emoji = itemEmojis[item] || '🎁';
            players.forEach(player => {
                text += `${emoji} ${item} → ${player}\n`;
            });
        });
    } else {
        text += `💎 Cristal do Caos → Nenhum sorteio realizado\n`;
        text += `🪶 Pena do Condor → Nenhum sorteio realizado\n`;
        text += `🔥 Chama do Condor → Nenhum sorteio realizado\n`;
        text += `⚡ Despertar → Nenhum sorteio realizado\n`;
        text += `⭐ Arcanjo → Nenhum sorteio realizado\n`;
    }
    
    text += `\n⸻\n\n`;
    text += `⚡🔥 KUNDUN 🔥⚡\n`;
    text += `🗓️ ${dateStr} – ${timeStr}\n\n`;
    text += `🎯 Escalação dos jogadores para o próximo Kundun:\n\n`;
    
    // Gerar próxima escalação
    state.items.forEach(item => {
        const emoji = itemEmojis[item] || '🎁';
        const suggestion = suggestFor(item, null, true); // preview mode
        if (suggestion) {
            text += `${emoji} ${item} → ${suggestion}\n`;
        } else {
            text += `${emoji} ${item} → Nenhum jogador disponível\n`;
        }
    });
    
    return text;
}

function showWinnersPreviewModal(winnersText) {
    const modal = document.getElementById('winners-preview-modal');
    const content = document.getElementById('winners-preview-content');
    
    if (!modal || !content) return;
    
    // Mostrar conteúdo no modal
    content.textContent = winnersText;
    
    // Mostrar modal
    modal.classList.add('show');
    
    // Configurar eventos do modal
    setupWinnersPreviewModalEvents(modal, winnersText);
}

function setupWinnersPreviewModalEvents(modal, winnersText) {
    const closeBtn = document.getElementById('close-winners-preview-modal');
    const closePreviewBtn = document.getElementById('btn-close-winners-preview');
    const copyBtn = document.getElementById('btn-copy-winners-text');
    
    // Função para fechar modal
    const closeWinnersPreviewModal = () => {
        modal.classList.remove('show');
    };
    
    // Eventos de fechar
    if (closeBtn) {
        closeBtn.removeEventListener('click', closeWinnersPreviewModal);
        closeBtn.addEventListener('click', closeWinnersPreviewModal);
    }
    if (closePreviewBtn) {
        closePreviewBtn.removeEventListener('click', closeWinnersPreviewModal);
        closePreviewBtn.addEventListener('click', closeWinnersPreviewModal);
    }
    
    // Evento de copiar
    if (copyBtn) {
        copyBtn.removeEventListener('click', copyWinnersTextAndClose);
        copyBtn.addEventListener('click', copyWinnersTextAndClose);
    }
    
    function copyWinnersTextAndClose() {
        copyToClipboard(winnersText);
        showToast('Lista de ganhadores copiada!');
        closeWinnersPreviewModal();
    }
    
    // Fechar ao clicar fora
    const clickOutside = (e) => {
        if (e.target === modal) {
            closeWinnersPreviewModal();
            modal.removeEventListener('click', clickOutside);
        }
    };
    modal.addEventListener('click', clickOutside);
}

function getLastWinners() {
    if (!state.history || state.history.length === 0) return [];
    
    // Pegar a data mais recente
    const lastDate = state.history[state.history.length - 1].date;
    
    // Filtrar todas as entradas da última data
    return state.history.filter(entry => entry.date === lastDate);
}

function getNextInLine() {
    const nextPlayers = [];
    
    state.items.forEach(item => {
        const suggestion = suggestFor(item, null, true); // preview mode
        if (suggestion && suggestion.length > 0) {
            nextPlayers.push({
                item: item,
                player: suggestion[0]
            });
        }
    });
    
    return nextPlayers;
}

function resetHistory() {
    if (confirm('Tem certeza que deseja resetar o histórico? Esta ação não pode ser desfeita!')) {
        // Limpar histórico do estado
        state.history = [];
        
        // Forçar salvamento no localStorage
        saveState(state);
        
        // Verificar se foi salvo corretamente e forçar novamente se necessário
        const verification = loadState();
        if (verification && verification.history && verification.history.length > 0) {
            localStorage.removeItem(STORAGE_KEY);
            saveState(state);
        }
        
        // Recarregar completamente o estado da variável global
        state = loadState() || createEmptyState();
        
        // Garantir que o histórico está vazio
        if (!state.history) state.history = [];
        
        // Atualizar todas as visualizações que dependem do histórico
        renderHistory();
        renderTable();
        renderSummaryCards();
        renderDashboard();
        
        alert('Histórico resetado com sucesso!');
    }
}

function resetDistributedItems() {
    if (confirm('Tem certeza que deseja resetar os itens já distribuídos? Esta ação não pode ser desfeita!')) {
        // Reset distributed items for all players
        state.players.forEach(player => {
            if (player.distributedItems) {
                player.distributedItems = [];
            }
        });
        saveState(state);
        alert('Itens distribuídos resetados com sucesso!');
        if (typeof renderTable === 'function') renderTable();
    }
}

function resetPlayers() {
    if (confirm('Tem certeza que deseja resetar todos os jogadores? Esta ação não pode ser desfeita.')) {
        state.players = [];
        saveState(state);
        alert('Jogadores resetados com sucesso!');
        if (typeof renderTable === 'function') renderTable();
    }
}

function resetRotations() {
    if (confirm('Resetar todas as rotações? Isso fará com que a distribuição volte a começar do primeiro jogador da lista para todos os itens.')) {
        // Resetar todas as rotações para 0
        for (const item of state.items) {
            state.rotation[item] = 0;
        }
        saveState(state);
        alert('Rotações resetadas! A distribuição agora começará do primeiro jogador da lista.');
        if (typeof renderTable === 'function') renderTable();
    }
}

function resetAll() {
    if (confirm('ATENÇÃO: Tem certeza que deseja resetar TODOS os dados? Esta ação não pode ser desfeita e apagará tudo!')) {
        if (confirm('Esta é sua última chance. Confirma que deseja apagar TODOS os dados?')) {
            localStorage.removeItem(STORAGE_KEY);
            state = createEmptyState();
            alert('Todos os dados foram resetados!');
            if (typeof renderTable === 'function') renderTable();
            if (typeof renderHistory === 'function') renderHistory();
        }
    }
}

// Modal de Distribuição
function initDistributeModal() {
    const modal = document.getElementById('distribute-modal');
    const openBtn = document.getElementById('btn-open-distribute-modal');
    const closeBtn = document.getElementById('close-distribute-modal');
    const cancelBtn = document.getElementById('btn-cancel-distribution');
    const previewBtn = document.getElementById('btn-preview-distribution');
    const confirmBtn = document.getElementById('btn-confirm-distribution');
    
    const playersSearchInput = document.getElementById('search-players');
    const itemsSearchInput = document.getElementById('search-items');
    const selectAllPlayersBtn = document.getElementById('select-all-players');
    const deselectAllPlayersBtn = document.getElementById('deselect-all-players');
    const selectAllItemsBtn = document.getElementById('select-all-items');
    const deselectAllItemsBtn = document.getElementById('deselect-all-items');
    
    const playersList = document.getElementById('players-list');
    const itemsList = document.getElementById('items-list');
    const previewContent = document.getElementById('preview-content');
    
    let selectedPlayers = new Set();
    let selectedItems = new Set();
    let itemQuantities = {}; // Armazena as quantidades de cada item
    let filteredPlayers = [];
    let filteredItems = [];
    
    // Abrir modal
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            modal.classList.add('show');
            renderPlayersList();
            renderItemsList();
            updatePreview();
        });
    }
    
    // Fechar modal
    function closeModal() {
        modal.classList.remove('show');
        selectedPlayers.clear();
        selectedItems.clear();
        updatePreview();
    }
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    // Fechar ao clicar fora do modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Renderizar lista de jogadores
    function renderPlayersList() {
        const searchTerm = playersSearchInput ? playersSearchInput.value.toLowerCase() : '';
        filteredPlayers = state.players.filter(player => 
            player.name.toLowerCase().includes(searchTerm)
        );
        
        if (!playersList) return;
        
        playersList.innerHTML = filteredPlayers.map(player => `
            <div class="player-item ${selectedPlayers.has(player.name) ? 'selected' : ''}" data-player="${player.name}">
                <input type="checkbox" ${selectedPlayers.has(player.name) ? 'checked' : ''}>
                <span>${player.name}</span>
            </div>
        `).join('');
        
        // Adicionar eventos de clique
        playersList.querySelectorAll('.player-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const playerName = item.dataset.player;
                const checkbox = item.querySelector('input');
                
                if (selectedPlayers.has(playerName)) {
                    selectedPlayers.delete(playerName);
                    checkbox.checked = false;
                    item.classList.remove('selected');
                } else {
                    selectedPlayers.add(playerName);
                    checkbox.checked = true;
                    item.classList.add('selected');
                }
                
                updatePreview();
            });
        });
    }
    
    // Renderizar lista de itens
    function renderItemsList() {
        const searchTerm = itemsSearchInput ? itemsSearchInput.value.toLowerCase() : '';
        filteredItems = state.items.filter(item => 
            item.toLowerCase().includes(searchTerm)
        );
        
        if (!itemsList) return;
        
        itemsList.innerHTML = filteredItems.map(item => {
            const isSelected = selectedItems.has(item);
            const quantity = itemQuantities[item] || 1;
            return `
                <div class="item-item ${isSelected ? 'selected' : ''}" data-item="${item}">
                    <div class="item-checkbox-section">
                        <input type="checkbox" ${isSelected ? 'checked' : ''}>
                        <span class="item-name">${item}</span>
                    </div>
                    ${isSelected ? `
                        <div class="item-quantity-section">
                            <label class="quantity-label">Qtd:</label>
                            <div class="quantity-controls">
                                <button type="button" class="qty-btn qty-minus" data-item="${item}">-</button>
                                <input type="number" class="quantity-input" data-item="${item}" value="${quantity}" min="1" max="99">
                                <button type="button" class="qty-btn qty-plus" data-item="${item}">+</button>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        // Adicionar eventos de clique para seleção
        itemsList.querySelectorAll('.item-checkbox-section').forEach(section => {
            section.addEventListener('click', (e) => {
                const itemElement = section.closest('.item-item');
                const itemName = itemElement.dataset.item;
                const checkbox = section.querySelector('input');
                
                if (selectedItems.has(itemName)) {
                    selectedItems.delete(itemName);
                    delete itemQuantities[itemName];
                    checkbox.checked = false;
                    itemElement.classList.remove('selected');
                } else {
                    selectedItems.add(itemName);
                    itemQuantities[itemName] = 1;
                    checkbox.checked = true;
                    itemElement.classList.add('selected');
                }
                
                renderItemsList(); // Re-renderizar para mostrar/ocultar controles de quantidade
                updatePreview();
            });
        });
        
        // Adicionar eventos para controles de quantidade
        itemsList.querySelectorAll('.qty-minus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemName = btn.dataset.item;
                const currentQty = itemQuantities[itemName] || 1;
                if (currentQty > 1) {
                    itemQuantities[itemName] = currentQty - 1;
                    renderItemsList();
                    updatePreview();
                }
            });
        });
        
        itemsList.querySelectorAll('.qty-plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemName = btn.dataset.item;
                const currentQty = itemQuantities[itemName] || 1;
                if (currentQty < 99) {
                    itemQuantities[itemName] = currentQty + 1;
                    renderItemsList();
                    updatePreview();
                }
            });
        });
        
        itemsList.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                e.stopPropagation();
                const itemName = input.dataset.item;
                let newQty = parseInt(input.value) || 1;
                newQty = Math.max(1, Math.min(99, newQty));
                itemQuantities[itemName] = newQty;
                input.value = newQty;
                updatePreview();
            });
        });
    }
    
    // Busca de jogadores
    if (playersSearchInput) {
        playersSearchInput.addEventListener('input', renderPlayersList);
    }
    
    // Busca de itens
    if (itemsSearchInput) {
        itemsSearchInput.addEventListener('input', renderItemsList);
    }
    
    // Marcar/Desmarcar todos os jogadores
    if (selectAllPlayersBtn) {
        selectAllPlayersBtn.addEventListener('click', () => {
            filteredPlayers.forEach(player => selectedPlayers.add(player.name));
            renderPlayersList();
            updatePreview();
        });
    }
    
    if (deselectAllPlayersBtn) {
        deselectAllPlayersBtn.addEventListener('click', () => {
            filteredPlayers.forEach(player => selectedPlayers.delete(player.name));
            renderPlayersList();
            updatePreview();
        });
    }
    
    // Marcar/Desmarcar todos os itens
    if (selectAllItemsBtn) {
        selectAllItemsBtn.addEventListener('click', () => {
            filteredItems.forEach(item => selectedItems.add(item));
            renderItemsList();
            updatePreview();
        });
    }
    
    if (deselectAllItemsBtn) {
        deselectAllItemsBtn.addEventListener('click', () => {
            filteredItems.forEach(item => selectedItems.delete(item));
            renderItemsList();
            updatePreview();
        });
    }
    
    // Atualizar prévia
    function updatePreview() {
        if (!previewContent) return;
        
        if (selectedPlayers.size === 0 || selectedItems.size === 0) {
            previewContent.innerHTML = '<p class="preview-empty">Selecione jogadores e itens para ver a prévia</p>';
            if (confirmBtn) confirmBtn.disabled = true;
            return;
        }
        
        const playersArray = Array.from(selectedPlayers);
        const itemsArray = Array.from(selectedItems);
        
        // Calcular distribuições
        const distributions = [];
        const uniqueItems = new Set();
        let totalDistributions = 0;
        let rounds = 1;
        
        itemsArray.forEach(item => {
            const quantity = itemQuantities[item] || 1;
            if (quantity === 1) {
                // Para quantidade 1, usar suggestFor
                const suggestion = suggestFor(item, playersArray, true); // modo prévia
                if (suggestion) {
                    distributions.push({ item, player: suggestion, quantity: 1 });
                    uniqueItems.add(item);
                    totalDistributions++;
                }
            } else {
                // Para quantidade > 1, usar nextNamesEqualize diretamente com os jogadores selecionados
                const playersFull = state.players.filter(p => playersArray.includes(p.name));
                if (playersFull.length > 0) {
                    const result = nextNamesEqualize(item, quantity, 0, false, playersFull);
                    result.names.forEach(playerName => {
                        distributions.push({ item, player: playerName, quantity: 1 });
                        uniqueItems.add(item);
                        totalDistributions++;
                    });
                }
            }
        });
        
        // Criar HTML da prévia
        let previewHtml = '<div class="preview-stats">';
        
        // Cards de estatísticas
        previewHtml += '<div class="stats-cards">';
        previewHtml += `<div class="stat-card">`;
        previewHtml += `<div class="stat-number">${totalDistributions}</div>`;
        previewHtml += `<div class="stat-label">TOTAL DE<br>DISTRIBUIÇÕES</div>`;
        previewHtml += `</div>`;
        
        previewHtml += `<div class="stat-card">`;
        previewHtml += `<div class="stat-number">${rounds}</div>`;
        previewHtml += `<div class="stat-label">RODADAS</div>`;
        previewHtml += `</div>`;
        
        previewHtml += `<div class="stat-card">`;
        previewHtml += `<div class="stat-number">${uniqueItems.size}</div>`;
        previewHtml += `<div class="stat-label">ITENS</div>`;
        previewHtml += `</div>`;
        previewHtml += '</div>';
        
        previewHtml += '</div>';
        
        // Lista de distribuições previstas
        if (distributions.length > 0) {
            previewHtml += '<div class="preview-distributions">';
            previewHtml += '<h4><span class="distribution-icon">📋</span> Quem vai receber cada item:</h4>';
            previewHtml += '<div class="distributions-list">';
            
            // Agrupar distribuições por item e jogador
            const groupedDistributions = {};
            distributions.forEach(({ item, player }) => {
                const key = `${item}-${player}`;
                if (!groupedDistributions[key]) {
                    groupedDistributions[key] = { item, player, count: 0 };
                }
                groupedDistributions[key].count++;
            });
            
            Object.values(groupedDistributions).forEach(({ item, player, count }) => {
                // Buscar emoji do item
                const itemEmoji = getItemEmoji(item);
                const playerEmoji = getPlayerEmoji(player);
                
                previewHtml += `<div class="distribution-row">`;
                previewHtml += `<div class="distribution-item-section">`;
                previewHtml += `<span class="item-emoji">${itemEmoji}</span>`;
                previewHtml += `<span class="item-name">${item}</span>`;
                if (count > 1) {
                    previewHtml += `<span class="item-quantity">×${count}</span>`;
                }
                previewHtml += `</div>`;
                previewHtml += `<div class="distribution-arrow">será entregue para</div>`;
                previewHtml += `<div class="distribution-player-section">`;
                previewHtml += `<span class="player-emoji">${playerEmoji}</span>`;
                previewHtml += `<span class="player-name">${player}</span>`;
                previewHtml += `</div>`;
                previewHtml += `</div>`;
            });
            
            previewHtml += '</div>';
            previewHtml += '</div>';
        } else {
            previewHtml += '<div class="preview-distributions">';
            previewHtml += '<div class="no-distributions">';
            previewHtml += '<span class="warning-icon">⚠️</span>';
            previewHtml += '<p>Nenhuma distribuição possível com os jogadores e itens selecionados.</p>';
            previewHtml += '</div>';
            previewHtml += '</div>';
        }
        
        previewContent.innerHTML = previewHtml;
        
        if (confirmBtn) confirmBtn.disabled = false;
    }
    
    // Função auxiliar para obter emoji do item
    function getItemEmoji(item) {
        const emojiMap = {
            'Cristal do Caos': '💎',
            'Pena do Condor': '🪶',
            'Chama do Condor': '🔥',
            'Despertar': '⚡',
            'Arcanjo': '⭐'
        };
        return emojiMap[item] || '📦';
    }
    
    // Função auxiliar para obter emoji do jogador
    function getPlayerEmoji(player) {
        // Usar primeira letra do nome para gerar emoji consistente
        const emojis = ['🧙', '⚔️', '🏹', '🛡️', '🗡️', '🏺', '💀', '👑'];
        const index = player.charCodeAt(0) % emojis.length;
        return emojis[index];
    }
    
    // Gerar prévia
    if (previewBtn) {
        previewBtn.addEventListener('click', updatePreview);
    }
    
    // Confirmar distribuição
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (selectedPlayers.size === 0 || selectedItems.size === 0) {
                showToast('Selecione jogadores e itens para distribuir');
                return;
            }
            
            const playersArray = Array.from(selectedPlayers);
            const itemsArray = Array.from(selectedItems);
            
            // Criar distribuição baseada nas sugestões e quantidades
            const assignments = [];
            itemsArray.forEach(item => {
                const quantity = itemQuantities[item] || 1;
                if (quantity === 1) {
                    // Para quantidade 1, usar suggestFor
                    const suggestion = suggestFor(item, playersArray, false); // modo normal
                    if (suggestion) {
                        assignments.push({ item, player: suggestion });
                    }
                } else {
                    // Para quantidade > 1, usar nextNamesEqualize diretamente com os jogadores selecionados
                    const playersFull = state.players.filter(p => playersArray.includes(p.name));
                    if (playersFull.length > 0) {
                        const result = nextNamesEqualize(item, quantity, 0, false, playersFull);
                        result.names.forEach(playerName => {
                            assignments.push({ item, player: playerName });
                        });
                    }
                }
            });
            
            if (assignments.length === 0) {
                showToast('Nenhuma distribuição válida encontrada');
                return;
            }
            
            // Aplicar distribuição
            const distributionSummary = {};
            assignments.forEach(({ item, player }) => {
                const playerObj = state.players.find(p => p.name === player);
                if (playerObj) {
                    if (!playerObj.counts) playerObj.counts = {};
                    playerObj.counts[item] = (playerObj.counts[item] || 0) + 1;
                    
                    // Para o histórico
                    if (!distributionSummary[player]) distributionSummary[player] = {};
                    distributionSummary[player][item] = (distributionSummary[player][item] || 0) + 1;
                }
            });
            
            // Adicionar faltas aos jogadores não presentes (não selecionados)
            const selectedPlayerNames = Array.from(selectedPlayers);
            state.players.forEach(player => {
                if (player.active !== false && !selectedPlayerNames.includes(player.name)) {
                    // Jogador ativo que não foi selecionado recebe +1 falta
                    player.faults = (player.faults || 0) + 1;
                }
            });
            
            // Adicionar ao histórico
            Object.entries(distributionSummary).forEach(([player, items]) => {
                Object.entries(items).forEach(([item, qty]) => {
                    state.history.push({
                        date: fmtDate(),
                        player,
                        item,
                        qty
                    });
                });
            });
            
            saveState(state);
            renderTable();
            renderHistory();
            
            // Mostrar modal de resultados
            showResultsModal(assignments, distributionSummary);
            closeModal();
        });
    }
}

// Navigate to configuration page
function goToConfig() {
    window.location.href = 'config.html';
}

// Função para mostrar modal de resultados
function showResultsModal(assignments, distributionSummary) {
    const modal = document.getElementById('results-modal');
    const content = document.getElementById('results-content');
    
    if (!modal || !content) return;
    
    // Gerar conteúdo do modal
    const resultsText = generateResultsText(assignments, distributionSummary);
    content.textContent = resultsText;
    
    // Mostrar modal
    modal.classList.add('show');
    
    // Configurar eventos do modal
    setupResultsModalEvents(modal, resultsText);
}

// Função para gerar o texto dos resultados
function generateResultsText(assignments, distributionSummary) {
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
    });
    const timeStr = currentDate.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    let text = `🏆 Ganhadores do último Kundun:\n`;
    
    // Mapear emojis dos itens
    const itemEmojis = {
        'Cristal do Caos': '💎',
        'Pena do Condor': '🪶',
        'Chama do Condor': '🔥',
        'Despertar': '⚡',
        'Arcanjo': '⭐'
    };
    
    // Agrupar assignments por item
    const itemGroups = {};
    assignments.forEach(({ item, player }) => {
        if (!itemGroups[item]) itemGroups[item] = [];
        itemGroups[item].push(player);
    });
    
    // Adicionar ganhadores
    Object.entries(itemGroups).forEach(([item, players]) => {
        const emoji = itemEmojis[item] || '🎁';
        players.forEach(player => {
            text += `${emoji} ${item} → ${player}\n`;
        });
    });
    
    text += `\n⸻\n\n`;
    text += `⚡🔥 KUNDUN 🔥⚡\n`;
    text += `🗓️ ${dateStr} – ${timeStr}\n\n`;
    text += `🎯 Escalação dos jogadores para o próximo Kundun:\n\n`;
    
    // Gerar próxima escalação
    state.items.forEach(item => {
        const emoji = itemEmojis[item] || '🎁';
        text += `${emoji} ${item}\n`;
        
        // Obter jogadores ativos ordenados por quantidade
        const activePlayers = state.players.filter(p => p.active);
        const playersWithCounts = activePlayers.map(p => ({
            name: p.name,
            count: (p.counts && p.counts[item]) || 0
        }));
        
        // Ordenar por quantidade (menor primeiro) e depois por ordem na planilha
        playersWithCounts.sort((a, b) => {
            if (a.count !== b.count) return a.count - b.count;
            // Manter ordem original da planilha
            const indexA = activePlayers.findIndex(p => p.name === a.name);
            const indexB = activePlayers.findIndex(p => p.name === b.name);
            return indexA - indexB;
        });
        
        const playersList = playersWithCounts
            .map(p => `${p.name} (${p.count})`)
            .join(' | ');
        
        text += `➡️ ${playersList}\n\n`;
    });
    
    text += `⸻\n\n`;
    text += `🚀 Bora time! Todo mundo online e pronto pra dar o nome.\n`;
    text += `⚔️ Quem não puder colar, fala no grupo pra remanejar.`;
    
    return text;
}

// Configurar eventos do modal de resultados
function setupResultsModalEvents(modal, resultsText) {
    const closeBtn = document.getElementById('close-results-modal');
    const closeResultsBtn = document.getElementById('btn-close-results');
    const copyBtn = document.getElementById('btn-copy-results');
    
    // Função para fechar modal
    const closeResultsModal = () => {
        modal.classList.remove('show');
        showToast(`Distribuição realizada com sucesso!`);
    };
    
    // Eventos de fechar
    if (closeBtn) {
        closeBtn.removeEventListener('click', closeResultsModal);
        closeBtn.addEventListener('click', closeResultsModal);
    }
    if (closeResultsBtn) {
        closeResultsBtn.removeEventListener('click', closeResultsModal);
        closeResultsBtn.addEventListener('click', closeResultsModal);
    }
    
    // Evento de copiar
    if (copyBtn) {
        copyBtn.removeEventListener('click', copyToClipboard);
        copyBtn.addEventListener('click', () => copyToClipboard(resultsText));
    }
    
    // Fechar ao clicar fora
    const clickOutside = (e) => {
        if (e.target === modal) {
            closeResultsModal();
            modal.removeEventListener('click', clickOutside);
        }
    };
    modal.addEventListener('click', clickOutside);
}

// Função para copiar texto para clipboard
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Texto copiado para a área de transferência!');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

// Fallback para copiar texto
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast('Texto copiado para a área de transferência!');
    } catch (err) {
        showToast('Erro ao copiar texto');
    }
    
    document.body.removeChild(textArea);
}

document.addEventListener("DOMContentLoaded", main);

// Toggle edição manual
function initToggleEdit() {
  const btnToggleEdit = document.getElementById('btn-toggle-edit');
  const updateToggleLabel = () => {
    if (!btnToggleEdit) return;
    btnToggleEdit.textContent = state.ui?.editUnlocked ? 'Travar edição' : 'Destravar edição';
  };
  if (btnToggleEdit) {
    btnToggleEdit.addEventListener('click', () => {
      state.ui.editUnlocked = !state.ui.editUnlocked; 
      saveState(state); 
      renderTable(); 
      updateToggleLabel();
    });
    updateToggleLabel();
  }
}

// Inicializar toggle edit após DOM carregado
document.addEventListener("DOMContentLoaded", () => {
  initToggleEdit();
});
