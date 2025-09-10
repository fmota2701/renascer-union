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
    console.log('Iniciando sincronização com Supabase...', state);
    
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

    console.log('Resposta da API:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('Estado sincronizado com Supabase:', result);
      showToast('Dados sincronizados com sucesso!', 'success');
    } else {
      const errorText = await response.text();
      console.error('Erro na resposta do servidor:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error('Erro ao sincronizar com Supabase:', error);
    showToast('Dados salvos localmente. Sincronização com Supabase falhou: ' + error.message, 'warning');
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

// Estado global para itens selecionados na tabela de distribuição
let selectedDistributionItems = new Set();

// Renderização da tabela
function renderTable() {
  const thead = $("#table-head");
  const tbody = $("#table-body");
  
  // Verificar se os elementos existem antes de manipulá-los
  if (!thead || !tbody || !state.items || !state.players) {
    console.warn('Elementos da tabela ou dados do estado não encontrados');
    return;
  }
  
  // Preservar jogadores destacados antes de limpar a tabela
  const highlightedPlayers = new Set();
  document.querySelectorAll('.player-not-selected').forEach(row => {
    const playerName = row.getAttribute('data-name');
    if (playerName) {
      highlightedPlayers.add(playerName);
    }
  });
  
  thead.innerHTML = "";
  tbody.innerHTML = "";
  
  // Renderizar também a tabela de itens
  renderItemsTable();

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
    th.dataset.col = col;
    th.style.cursor = "pointer";
    th.title = "Clique para ordenar";
    
    // Verificar se é uma coluna de item e tem ícone
    if (state.items && state.items.includes(col)) {
      const iconSvg = getItemIcon(col);
      if (iconSvg) {
        th.innerHTML = `<div class="item-with-icon"><div class="custom-icon">${iconSvg}</div><span>${col}</span></div>`;
      } else {
        th.textContent = col;
      }
    } else {
      th.textContent = col;
    }
    
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
    
    // Container para os botões
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.gap = '4px';
    
    // Botão Presente
    const btnPresente = document.createElement('button');
    btnPresente.textContent = 'Presente';
    btnPresente.className = p.active !== false ? 'btn-presente active' : 'btn-presente';
    btnPresente.style.cssText = `
      padding: 2px 6px;
      font-size: 10px;
      border: 1px solid #28a745;
      background: ${p.active !== false ? '#28a745' : 'transparent'};
      color: ${p.active !== false ? 'white' : '#28a745'};
      cursor: pointer;
      border-radius: 3px;
    `;
    
    // Botão Ausente
    const btnAusente = document.createElement('button');
    btnAusente.textContent = 'Ausente';
    btnAusente.className = p.active === false ? 'btn-ausente active' : 'btn-ausente';
    btnAusente.style.cssText = `
      padding: 2px 6px;
      font-size: 10px;
      border: 1px solid #dc3545;
      background: ${p.active === false ? '#dc3545' : 'transparent'};
      color: ${p.active === false ? 'white' : '#dc3545'};
      cursor: pointer;
      border-radius: 3px;
    `;
    
    // Event listeners
    btnPresente.addEventListener('click', async () => {
      try {
        p.active = true;
        saveState(state);
        
        // Atualizar status do jogador no Supabase
        await updatePlayerStatusInSupabase(p.name, true);
        
        savePlayerSelectionToStorage();
        renderTable();
      } catch (error) {
        console.error('Erro ao marcar jogador como presente:', error);
        showToast('Erro ao marcar jogador como presente', 'error');
      }
    });
    
    btnAusente.addEventListener('click', async () => {
      try {
        p.active = false;
        saveState(state);
        
        // Atualizar status do jogador no Supabase
        await updatePlayerStatusInSupabase(p.name, false);
        
        savePlayerSelectionToStorage();
        renderTable();
      } catch (error) {
        console.error('Erro ao marcar jogador como ausente:', error);
        showToast('Erro ao marcar jogador como ausente', 'error');
      }
    });
    
    buttonsContainer.appendChild(btnPresente);
    buttonsContainer.appendChild(btnAusente);
    tdActive.appendChild(buttonsContainer);
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

  // Reaplicar destaques visuais preservados
  if (highlightedPlayers.size > 0) {
    document.querySelectorAll('#players-table tbody tr').forEach(row => {
      const playerName = row.getAttribute('data-name');
      if (playerName && highlightedPlayers.has(playerName)) {
        row.classList.add('player-not-selected');
        console.log(`DEBUG - Reaplica destaque para: ${playerName}`);
      }
    });
  }

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
      opt.value = it;
      const iconSvg = getItemIcon(it);
      if (iconSvg) {
        opt.textContent = `🎯 ${it}`; // Emoji temporário até implementar ícones nos selects
      } else {
        opt.textContent = it;
      }
      sel.appendChild(opt);
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
  if (rows) {
    for (const sel of rows.querySelectorAll("select")) {
      const current = sel.value;
      if (sel && state.items) {
        sel.innerHTML = state.items.map((i) => {
          const iconSvg = getItemIcon(i);
          const displayText = iconSvg ? `🎯 ${i}` : i;
          return `<option value="${i}">${displayText}</option>`;
        }).join("");
        if (state.items.includes(current)) sel.value = current; else sel.value = state.items[0];
      }
    }
  }
}

// Estado global para ícones personalizados
let customIcons = {};

// Carregar ícones personalizados do localStorage
function loadCustomIcons() {
  try {
    const saved = localStorage.getItem('customIcons');
    if (saved) {
      customIcons = JSON.parse(saved);
    }
  } catch (error) {
    console.warn('Erro ao carregar ícones personalizados:', error);
    customIcons = {};
  }
}

// Pré-carregar ícones SVG padrão
async function preloadDefaultIcons() {
  const defaultItems = ['Cristal do Caos', 'Pena do Condor', 'Chama do Condor', 'Despertar', 'Arcanjo'];
  
  for (const itemName of defaultItems) {
    if (!customIcons[itemName] && !svgIconsCache[itemName]) {
      await loadSvgIcon(itemName);
    }
  }
}

// Salvar ícones personalizados no localStorage
function saveCustomIcons() {
  try {
    localStorage.setItem('customIcons', JSON.stringify(customIcons));
  } catch (error) {
    console.error('Erro ao salvar ícones personalizados:', error);
  }
}

// Cache para ícones SVG carregados
let svgIconsCache = {};

// Carregar ícone SVG da pasta icons/
async function loadSvgIcon(itemName) {
  const fileName = itemName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const iconPath = `icons/${fileName}.svg`;
  
  try {
    const response = await fetch(iconPath);
    if (response.ok) {
      const svgContent = await response.text();
      svgIconsCache[itemName] = svgContent;
      return svgContent;
    }
  } catch (error) {
    console.warn(`Não foi possível carregar ícone SVG para ${itemName}:`, error);
  }
  
  return null;
}

// Obter ícone de um item (personalizado, SVG ou emoji padrão)
function getItemIcon(itemName) {
  // 1. Verificar se há ícone personalizado no localStorage
  if (customIcons[itemName]) {
    return customIcons[itemName];
  }
  
  // 2. Verificar se há ícone SVG no cache
  if (svgIconsCache[itemName]) {
    return svgIconsCache[itemName];
  }
  
  // 3. Tentar carregar ícone SVG da pasta icons/
  loadSvgIcon(itemName).then(svgContent => {
    if (svgContent) {
      // Re-renderizar elementos que usam este ícone
      renderItemsManager();
      renderItemsTable();
    }
  });
  
  // 4. Fallback para emojis padrão
  const defaultEmojis = {
    'Cristal do Caos': '💎',
    'Pena do Condor': '🪶',
    'Chama do Condor': '🔥',
    'Despertar': '⚡',
    'Arcanjo': '⭐'
  };
  
  return defaultEmojis[itemName] || '🎁';
}

// Gerenciador de Itens (renomear/remover)
function renderItemsManager() {
  const wrap = document.getElementById('items-manager');
  if (!wrap || !state.items) return;
  
  wrap.innerHTML = state.items.map(name => {
    const icon = getItemIcon(name);
    const isCustomIcon = customIcons[name];
    const iconDisplay = isCustomIcon ? `<div class="custom-icon">${icon}</div>` : icon;
    
    return `
      <div class="row" data-name="${name}" style="border-left: 4px solid #ff9800; margin-bottom: 10px; padding: 10px;">
        <div class="item-info">
          <span class="name" style="font-weight: bold; font-size: 16px;">${iconDisplay} ${name}</span>
          <div class="item-meta" style="font-size: 12px; color: #666; margin-top: 5px;">
            <div>🎯 Item do sistema ${isCustomIcon ? '(ícone personalizado)' : ''}</div>
          </div>
        </div>
        <span class="actions">
          <button class="secondary btn-edit">✏️ Editar</button>
          <button class="primary btn-icon">🎨 Ícone</button>
          <button class="danger btn-delete">🗑️ Excluir</button>
        </span>
      </div>
    `;
  }).join("") || '<em>Nenhum item cadastrado.</em>';
  
  wrap.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.row');
      const oldName = row?.dataset.name;
      const newName = prompt('Novo nome do item:', oldName || '');
      if (!newName || newName === oldName) return;
      renameItem(oldName, newName);
    });
  });
  
  wrap.querySelectorAll('.btn-icon').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.row');
      const itemName = row?.dataset.name;
      if (!itemName) return;
      openIconUploadModal(itemName);
    });
  });
  

  
  wrap.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.row');
      const name = row?.dataset.name;
      if (!name) return;
      if (!confirm(`Excluir item "${name}"? Isso não apaga o histórico.`)) return;
      removeItem(name);
    });
  });
}



// Remover ícone personalizado
function removeIcon(itemName) {
  if (!confirm(`Remover ícone personalizado de "${itemName}"?`)) return;
  delete customIcons[itemName];
  saveCustomIcons();
  renderItemsManager();
  showToast(`Ícone personalizado removido de ${itemName}.`, 'info');
}

// Limpar todos os ícones
function clearAllIcons() {
  if (!confirm('Remover todos os ícones personalizados? Esta ação não pode ser desfeita.')) return;
  customIcons = {};
  saveCustomIcons();
  renderItemsManager();
  showToast('Todos os ícones personalizados foram removidos.', 'info');
}

// Abrir modal de upload de ícone para um item específico
function openIconUploadModal(itemName) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h3>🎨 Gerenciar Ícone - ${itemName}</h3>
        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="icon-upload-section">
          <div class="upload-controls" style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;">
            <input type="file" id="modal-icon-file-input" accept=".svg" style="display: none;">
            <button type="button" id="modal-btn-upload-icon" class="secondary" onclick="document.getElementById('modal-icon-file-input').click()">
              📁 Escolher Ícone SVG
            </button>
            <button type="button" id="modal-btn-save-icon" class="primary" disabled>
              💾 Salvar Ícone
            </button>
            ${customIcons[itemName] ? `<button type="button" id="modal-btn-remove-icon" class="danger">
              🗑️ Remover Ícone Atual
            </button>` : ''}
          </div>
          
          <div id="modal-icon-preview" class="icon-preview" style="display: none; padding: 15px; border: 2px dashed #ddd; border-radius: 8px; text-align: center; background: #f9f9f9;">
            <h4>Prévia do Ícone:</h4>
            <div id="modal-icon-preview-content" style="margin: 10px 0;"></div>
            <p style="font-size: 12px; color: #666; margin: 5px 0;">Nome do arquivo: <span id="modal-icon-filename"></span></p>
          </div>
          
          ${customIcons[itemName] ? `<div class="current-icon" style="margin-top: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
            <h4>Ícone Atual:</h4>
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="custom-icon">${customIcons[itemName]}</div>
              <span>${itemName}</span>
            </div>
          </div>` : ''}
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners para o modal
  const fileInput = modal.querySelector('#modal-icon-file-input');
  const saveBtn = modal.querySelector('#modal-btn-save-icon');
  const removeBtn = modal.querySelector('#modal-btn-remove-icon');
  
  let currentSvgContent = null;
  
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.svg')) {
      showToast('Por favor, selecione apenas arquivos SVG!', 'error');
      return;
    }
    
    if (file.size > 500 * 1024) {
      showToast('Arquivo muito grande! Máximo 500KB.', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      currentSvgContent = e.target.result;
      
      // Otimizar SVG
      const optimizedSvg = currentSvgContent
        .replace(/width="[^"]*"/g, 'width="20"')
        .replace(/height="[^"]*"/g, 'height="20"')
        .replace(/\s+/g, ' ')
        .trim();
      
      currentSvgContent = optimizedSvg;
      
      // Mostrar prévia
      const preview = modal.querySelector('#modal-icon-preview');
      const previewContent = modal.querySelector('#modal-icon-preview-content');
      const filename = modal.querySelector('#modal-icon-filename');
      
      preview.style.display = 'block';
      previewContent.innerHTML = optimizedSvg;
      filename.textContent = file.name;
      saveBtn.disabled = false;
    };
    reader.readAsText(file);
  });
  
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (!currentSvgContent) return;
      
      customIcons[itemName] = currentSvgContent;
      saveCustomIcons();
      renderItemsManager();
      showToast(`Ícone salvo para ${itemName}!`, 'success');
      modal.remove();
    });
  }
  
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      if (!confirm(`Remover ícone personalizado de "${itemName}"?`)) return;
      
      delete customIcons[itemName];
      saveCustomIcons();
      renderItemsManager();
      showToast(`Ícone removido de ${itemName}!`, 'success');
      modal.remove();
    });
  }
}

// Renderização da tabela de itens para distribuição
function renderItemsTable() {
  const tbody = document.getElementById('items-table-body');
  if (!tbody || !state.items) return;
  
  tbody.innerHTML = state.items.map(item => {
    const isSelected = selectedDistributionItems.has(item);
    const iconSvg = getItemIcon(item);
    const itemDisplay = iconSvg ? 
      `<div class="item-with-icon"><div class="custom-icon">${iconSvg}</div><span>${item}</span></div>` : 
      item;
    return `
      <tr data-item="${item}">
        <td>
          <input type="checkbox" ${isSelected ? 'checked' : ''} 
                 onchange="toggleItemSelection('${item}')">
        </td>
        <td>${itemDisplay}</td>
        <td>
          <input type="number" min="1" value="1" 
                 id="qty-${item}" class="item-quantity" 
                 style="width: 60px; text-align: center;">
        </td>
      </tr>
    `;
  }).join('');
}

// Função para alternar seleção de item na tabela
function toggleItemSelection(itemName) {
  if (selectedDistributionItems.has(itemName)) {
    selectedDistributionItems.delete(itemName);
    // Remove do sorteio quando desmarcado
    clearCurrentDraw();
  } else {
    selectedDistributionItems.add(itemName);
    // Trigger sorteio automático quando selecionado
    triggerAutomaticDraw(itemName);
  }
  renderItemsTable();
}

// Função para limpar sorteio atual
async function clearCurrentDraw() {
  try {
    // Limpar sorteio ativo usando localStorage e tabela players
    const currentDraw = localStorage.getItem('currentDraw');
    if (currentDraw) {
      const drawData = JSON.parse(currentDraw);
      await supabase
        .from('players')
        .delete()
        .eq('id', drawData.id);
      
      localStorage.removeItem('currentDraw');
    }
  } catch (error) {
    console.error('Erro ao limpar sorteio:', error);
  }
}

// Sistema de fila de prioridade baseado em menor quantidade
function getPriorityQueue(itemName) {
  const activePlayers = state.players.filter(p => p.active !== false);
  
  if (activePlayers.length === 0) return [];
  
  // Agrupar jogadores por quantidade do item
  const playersByQuantity = {};
  activePlayers.forEach(player => {
    const quantity = player.counts[itemName] || 0;
    if (!playersByQuantity[quantity]) {
      playersByQuantity[quantity] = [];
    }
    playersByQuantity[quantity].push(player);
  });
  
  // Ordenar por quantidade (menor primeiro) e depois por ordem na lista
  const sortedQuantities = Object.keys(playersByQuantity)
    .map(q => parseInt(q))
    .sort((a, b) => a - b);
  
  const priorityQueue = [];
  sortedQuantities.forEach(quantity => {
    // Manter ordem original da lista para jogadores com mesma quantidade
    const playersWithSameQuantity = playersByQuantity[quantity]
      .sort((a, b) => {
        const indexA = state.players.findIndex(p => p.name === a.name);
        const indexB = state.players.findIndex(p => p.name === b.name);
        return indexA - indexB;
      });
    
    priorityQueue.push(...playersWithSameQuantity.map(p => ({
      name: p.name,
      quantity: quantity,
      priority: priorityQueue.length + 1
    })));
  });
  
  return priorityQueue;
}

// Função para trigger do sorteio automático com sistema de fila de prioridade
async function triggerAutomaticDraw(itemName) {
  try {
    // Verificar se já existe um sorteio ativo
    const existingDraw = localStorage.getItem('currentDraw');
    if (existingDraw) {
      console.log('Já existe um sorteio ativo. Cancelando novo sorteio.');
      return;
    }
    
    // Obter fila de prioridade para o item
    const priorityQueue = getPriorityQueue(itemName);
    
    if (priorityQueue.length === 0) {
      console.log('Nenhum jogador ativo disponível para sorteio.');
      return;
    }
    
    // Selecionar o primeiro da fila (maior prioridade)
    const selectedPlayer = priorityQueue[0];
    
    // Criar registro especial na tabela players para o sorteio ativo
    const drawName = `DRAW_ACTIVE_${selectedPlayer.name}_${itemName}_${Date.now()}`;
    
    const { data, error } = await supabase
      .from('players')
      .insert({
        name: drawName,
        total_received: 1, // Flag para sorteio ativo
        faults: 0,
        total_distributions: 0
      })
      .select();
    
    if (error) {
      console.error('Erro ao salvar sorteio:', error);
      return;
    }
    
    // Salvar dados do sorteio no localStorage para referência
    const drawData = {
      id: data[0].id,
      player_name: selectedPlayer.name,
      item_name: itemName,
      draw_time: new Date().toISOString(),
      status: 'active',
      priority_position: selectedPlayer.priority,
      player_quantity: selectedPlayer.quantity,
      total_queue_size: priorityQueue.length
    };
    
    localStorage.setItem('currentDraw', JSON.stringify(drawData));
    
    console.log(`Sorteio automático (Prioridade ${selectedPlayer.priority}/${priorityQueue.length}): ${selectedPlayer.name} para ${itemName} (possui ${selectedPlayer.quantity})`);
    
    // Log da fila de prioridade para debug
    console.log('Fila de prioridade:', priorityQueue.slice(0, 5).map(p => `${p.name} (${p.quantity})`));
    
  } catch (error) {
    console.error('Erro no sorteio automático:', error);
  }
}

// Gerenciador de Jogadores (lista simples com editar/excluir)
function renderPlayersManager() {
  const wrap = document.getElementById('players-manager');
  if (!wrap || !state.players) return;
  
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

async function deletePlayer(name) {
  const idx = state.players.findIndex(p=>p.name===name);
  if (idx<0) return;
  
  // Sincronizar com Supabase primeiro
  try {
    const response = await fetch(`/.netlify/functions/supabase-api/players?name=${encodeURIComponent(name)}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      console.error('Erro ao deletar jogador do Supabase:', await response.text());
      showToast('Erro ao sincronizar remoção do jogador', 'error');
      return;
    }
  } catch (error) {
    console.error('Erro ao deletar jogador:', error);
    showToast('Erro ao sincronizar remoção do jogador', 'error');
    return;
  }
  
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
  showToast(`Jogador "${name}" removido com sucesso!`, 'success');
}

async function addItem(name) {
  const n = name.trim();
  if (!n) return alert('Informe um nome.');
  if (state.items.includes(n)) return alert('Já existe um item com esse nome.');
  state.items.push(n);
  for (const p of state.players) p.counts[n] = p.counts[n] || 0;
  saveState(state);
  
  // Sincronizar com Supabase
  try {
    const response = await fetch('/.netlify/functions/supabase-api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: n })
    });
    
    if (!response.ok) {
      console.error('Erro ao sincronizar item com Supabase:', await response.text());
    }
  } catch (error) {
    console.error('Erro ao sincronizar item:', error);
  }
  
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

async function removeItem(name) {
  const i = state.items.indexOf(name);
  if (i < 0) return;
  
  // Sincronizar com Supabase primeiro
  try {
    const response = await fetch(`/.netlify/functions/supabase-api/items?name=${encodeURIComponent(name)}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      console.error('Erro ao deletar item do Supabase:', await response.text());
      showToast('Erro ao sincronizar remoção do item', 'error');
      return;
    }
  } catch (error) {
    console.error('Erro ao deletar item:', error);
    showToast('Erro ao sincronizar remoção do item', 'error');
    return;
  }
  
  state.items.splice(i, 1);
  for (const p of state.players) delete p.counts[name];
  delete state.rotation[name];
  // histórico mantido para registro
  saveState(state);
  renderItemsSelect();
  renderItemsManager();
  renderTable();
  initFocusControls(); initQueuePanel(); renderQueuePanel();
  showToast(`Item "${name}" removido com sucesso!`, 'success');
}

function renderHistory() {
  const body = document.getElementById('history-body');
  if (!body || !state.history) return;
  body.innerHTML = state.history
    .slice()
    .reverse()
    .map((h, index) => {
      const originalIndex = state.history.length - 1 - index;
      // Usar o ID real da base de dados se disponível, senão usar o índice
      const identifier = h.id ? h.id : originalIndex;
      const dataAttribute = h.id ? 'data-id' : 'data-index';
      const iconSvg = getItemIcon(h.item);
      const itemDisplay = iconSvg ? 
        `<div class="item-with-icon"><div class="custom-icon">${iconSvg}</div><span>${h.item}</span></div>` : 
        h.item;
      return `<tr>
        <td>${h.date}</td>
        <td>${h.player}</td>
        <td>${itemDisplay}</td>
        <td class="num">${h.qty||1}</td>
        <td><button class="danger btn-delete-history" ${dataAttribute}="${identifier}" title="Excluir esta distribuição">🗑️</button></td>
      </tr>`;
    })
    .join("");
    
  // Adicionar event listeners para os botões de excluir
  body.querySelectorAll('.btn-delete-history').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.id) {
        // Se tem ID da base de dados, usar deleteHistoryEntryById
        const id = parseInt(btn.dataset.id);
        deleteHistoryEntryById(id);
      } else {
        // Se não tem ID, usar o método antigo com índice
        const index = parseInt(btn.dataset.index);
        deleteHistoryEntry(index);
      }
    });
  });
}

// Função para excluir uma entrada específica do histórico por ID da base de dados
async function deleteHistoryEntryById(id) {
  const entry = state.history.find(h => h.id === id);
  if (!entry) {
    showToast('Entrada do histórico não encontrada', 'error');
    return;
  }
  
  if (!confirm(`Excluir distribuição: ${entry.item} para ${entry.player} em ${entry.date}?`)) return;
  
  try {
    console.log('Deletando entrada do histórico da base de dados:', id);
    const response = await fetch(`/.netlify/functions/supabase-api/history?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao deletar da base de dados: ${errorText}`);
    }
    
    console.log('Entrada deletada da base de dados com sucesso');
    
    // Reverter contadores do jogador
    const player = state.players.find(p => p.name === entry.player);
    if (player && player.counts) {
      const currentCount = player.counts[entry.item] || 0;
      const qtyToRemove = entry.qty || 1;
      player.counts[entry.item] = Math.max(0, currentCount - qtyToRemove);
    }
    
    // Remover entrada do histórico local
    const index = state.history.findIndex(h => h.id === id);
    if (index !== -1) {
      state.history.splice(index, 1);
    }
    
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
    syncStateToSupabase(state);
    renderTable();
    renderHistory();
    showToast('Distribuição excluída com sucesso', 'success');
  } catch (error) {
    console.error('Erro ao excluir entrada do histórico:', error);
    showToast('Erro ao excluir entrada do histórico: ' + error.message, 'error');
  }
}

// Função para excluir uma entrada específica do histórico por índice (método antigo)
async function deleteHistoryEntry(index) {
  if (index < 0 || index >= state.history.length) return;
  
  const entry = state.history[index];
  if (!confirm(`Excluir distribuição: ${entry.item} para ${entry.player} em ${entry.date}?`)) return;
  
  try {
    // Se a entrada tem ID (veio do Supabase), deletar da base de dados
    if (entry.id) {
      console.log('Deletando entrada do histórico da base de dados:', entry.id);
      const response = await fetch(`/.netlify/functions/supabase-api/history?id=${entry.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao deletar da base de dados: ${errorText}`);
      }
      
      console.log('Entrada deletada da base de dados com sucesso');
    }
    
    // Reverter contadores do jogador
    const player = state.players.find(p => p.name === entry.player);
    if (player && player.counts) {
      const currentCount = player.counts[entry.item] || 0;
      const qtyToRemove = entry.qty || 1;
      player.counts[entry.item] = Math.max(0, currentCount - qtyToRemove);
    }
    
    // Remover entrada do histórico local
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
    syncStateToSupabase(state);
    renderTable();
    renderHistory();
    showToast('Distribuição excluída com sucesso', 'success');
  } catch (error) {
    console.error('Erro ao excluir entrada do histórico:', error);
    showToast('Erro ao excluir entrada do histórico: ' + error.message, 'error');
  }
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
    
    const iconSvg = getItemIcon(ranking.item);
    const itemTitleDisplay = iconSvg ? 
      `<div class="item-with-icon"><div class="custom-icon">${iconSvg}</div><span>${ranking.item}</span></div>` : 
      ranking.item;
    
    return `
      <div class="item-ranking">
        <h4 class="item-title">${itemTitleDisplay}</h4>
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

  // Limpar destaque vermelho
  const btnClearHighlights = document.getElementById('btn-clear-highlights');
  if (btnClearHighlights) btnClearHighlights.addEventListener('click', () => clearPlayerHighlights());

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
      // Se não há dados no Supabase, inicializar com itens padrão
      console.log('Nenhum dado encontrado no Supabase - inicializando com itens padrão');
      state.items = [...DEFAULT_ITEMS];
      showToast('Inicializado com itens padrão', 'info');
    }
  } catch (error) {
    console.warn('Erro ao carregar dados do Supabase:', error);
    // Em caso de erro, também inicializar com itens padrão
    state.items = [...DEFAULT_ITEMS];
    showToast('Erro ao carregar dados. Usando itens padrão.', 'warning');
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
  initRealtimeSync();

  // Carregar ícones personalizados
  loadCustomIcons();

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

function highlightNonSelectedPlayers(selectedPlayers) {
  // Limpar destaques anteriores
  document.querySelectorAll('.player-not-selected').forEach(row => {
    row.classList.remove('player-not-selected');
  });
  
  // Obter todos os jogadores ativos da tabela
  const allPlayerRows = document.querySelectorAll('#players-table tbody tr');
  
  allPlayerRows.forEach(row => {
    const playerName = row.getAttribute('data-name');
    const checkbox = row.querySelector('input[type="checkbox"]');
    
    // Verificar se o jogador está ativo (checkbox marcado) e não foi selecionado
    if (checkbox && checkbox.checked && !selectedPlayers.includes(playerName)) {
      row.classList.add('player-not-selected');
      console.log(`DEBUG - Destacando jogador não selecionado: ${playerName}`);
    }
  });
}

function clearPlayerHighlights() {
  document.querySelectorAll('.player-not-selected').forEach(row => {
    row.classList.remove('player-not-selected');
  });
  console.log('DEBUG - Destaques removidos manualmente');
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
            // Aplicar destaque visual inicial (se houver jogadores selecionados)
            highlightNonSelectedPlayers(Array.from(selectedPlayers));
            updatePreview();
        });
    }
    
    // Fechar modal
    function closeModal() {
        modal.classList.remove('show');
        selectedPlayers.clear();
        selectedItems.clear();
        // Limpar destaque visual ao fechar o modal
        clearPlayerHighlights();
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
            player.name.toLowerCase().includes(searchTerm) && player.active !== false
        );
        
        if (!playersList) return;
        
        playersList.innerHTML = filteredPlayers.map(player => `
            <div class="player-item ${selectedPlayers.has(player.name) ? 'selected' : ''}" data-player="${player.name}">
                <span class="player-name">${player.name}</span>
                <div class="presence-buttons">
                    <button class="btn-presente ${selectedPlayers.has(player.name) ? 'active' : ''}" data-action="presente">
                        Presente
                    </button>
                    <button class="btn-ausente ${!selectedPlayers.has(player.name) ? 'active' : ''}" data-action="ausente">
                        Ausente
                    </button>
                </div>
            </div>
        `).join('');
        
        // Adicionar eventos de clique nos botões
        playersList.querySelectorAll('.player-item').forEach(item => {
            const playerName = item.dataset.player;
            const btnPresente = item.querySelector('.btn-presente');
            const btnAusente = item.querySelector('.btn-ausente');
            
            btnPresente.addEventListener('click', (e) => {
                e.stopPropagation();
                selectedPlayers.add(playerName);
                item.classList.add('selected');
                btnPresente.classList.add('active');
                btnAusente.classList.remove('active');
                
                // Aplicar destaque visual em tempo real na tabela
                highlightNonSelectedPlayers(Array.from(selectedPlayers));
                updatePreview();
            });
            
            btnAusente.addEventListener('click', (e) => {
                e.stopPropagation();
                selectedPlayers.delete(playerName);
                item.classList.remove('selected');
                btnAusente.classList.add('active');
                btnPresente.classList.remove('active');
                
                // Aplicar destaque visual em tempo real na tabela
                highlightNonSelectedPlayers(Array.from(selectedPlayers));
                updatePreview();
            });
        });
    }
    
    // Renderizar lista de itens (apenas itens selecionados na tabela)
    function renderItemsList() {
        const searchTerm = itemsSearchInput ? itemsSearchInput.value.toLowerCase() : '';
        // Filtrar apenas itens selecionados na tabela de distribuição
        const selectedItemsArray = Array.from(selectedDistributionItems);
        filteredItems = selectedItemsArray.filter(item => 
            item.toLowerCase().includes(searchTerm)
        );
        
        if (!itemsList) return;
        
        if (filteredItems.length === 0) {
            itemsList.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 15px;">📦</div>
                    <p>Nenhum item selecionado na tabela de distribuição.</p>
                    <p style="font-size: 14px; opacity: 0.8;">Selecione itens na tabela ao lado para distribuir.</p>
                </div>
            `;
            return;
        }
        
        itemsList.innerHTML = filteredItems.map(item => {
            const isSelected = selectedItems.has(item);
            const quantity = itemQuantities[item] || document.getElementById(`qty-${item}`)?.value || 1;
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
            // Aplicar destaque visual em tempo real na tabela
            highlightNonSelectedPlayers(Array.from(selectedPlayers));
            updatePreview();
        });
    }
    
    if (deselectAllPlayersBtn) {
        deselectAllPlayersBtn.addEventListener('click', () => {
            filteredPlayers.forEach(player => selectedPlayers.delete(player.name));
            renderPlayersList();
            // Aplicar destaque visual em tempo real na tabela
            highlightNonSelectedPlayers(Array.from(selectedPlayers));
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
                    const result = nextNamesEqualize(item, quantity, 0, true, playersFull);
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
        confirmBtn.addEventListener('click', async () => {
            if (selectedPlayers.size === 0 || selectedItems.size === 0) {
                showToast('Selecione jogadores e itens para distribuir');
                return;
            }
            
            // Pausar sincronização automática durante distribuição
            isDistributionInProgress = true;
            
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
                        // Usar noRepeat=true para distribuir um item por jogador na fila
                        const result = nextNamesEqualize(item, quantity, 0, true, playersFull);
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
            
            // Aplicar distribuição via API do Supabase
            try {
                // Agrupar assignments por jogador e item para enviar a quantidade correta
                const distributionMap = new Map();
                assignments.forEach(({ item, player }) => {
                    const key = `${player}|${item}`;
                    if (!distributionMap.has(key)) {
                        distributionMap.set(key, { player_name: player, item_name: item, quantity: 0 });
                    }
                    distributionMap.get(key).quantity += 1;
                });
                
                const distributions = Array.from(distributionMap.values()).map(dist => ({
                    ...dist,
                    notes: `Distribuição automática - ${fmtDate()}`
                }));
                
                // Obter lista de jogadores selecionados
                const selectedPlayers = [...new Set(assignments.map(a => a.player))];
                
                console.log('Enviando distribuições para API:', distributions);
                console.log('DEBUG - Jogadores selecionados:', selectedPlayers);
                
                // Aplicar destaque visual aos jogadores não selecionados
                highlightNonSelectedPlayers(selectedPlayers);
                
                const response = await fetch('/.netlify/functions/supabase-api/distribute', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        distributions,
                        selectedPlayers 
                    })
                });
                
                console.log('Resposta da API - Status:', response.status);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Erro na API:', errorText);
                    throw new Error(`Erro na API: ${response.status} - ${errorText}`);
                }
                
                const result = await response.json();
                console.log('Resultado da API:', result);
                
                if (result.errors && result.errors.length > 0) {
                    console.warn('Alguns erros na distribuição:', result.error_details);
                    showToast(`Distribuição parcial: ${result.success} sucessos, ${result.errors} erros`, 'warning');
                } else {
                    showToast(`Distribuição realizada com sucesso! ${result.success} itens distribuídos`, 'success');
                }
                
                // Atualizar estado local para manter compatibilidade
                const distributionSummary = {};
                assignments.forEach(({ item, player }) => {
                    const playerObj = state.players.find(p => p.name === player);
                    if (playerObj) {
                        if (!playerObj.counts) playerObj.counts = {};
                        playerObj.counts[item] = (playerObj.counts[item] || 0) + 1;
                        
                        // Para o histórico local
                        if (!distributionSummary[player]) distributionSummary[player] = {};
                        distributionSummary[player][item] = (distributionSummary[player][item] || 0) + 1;
                    }
                });
                
                // Adicionar faltas aos jogadores não presentes (não selecionados)
                const selectedPlayerNames = Array.from(selectedPlayers);
                console.log('DEBUG - Jogadores selecionados:', selectedPlayerNames);
                console.log('DEBUG - Todos os jogadores:', state.players.map(p => ({ name: p.name, active: p.active, faults: p.faults })));
                
                state.players.forEach(player => {
                    const isActive = player.active !== false;
                    const wasSelected = selectedPlayerNames.includes(player.name);
                    
                    console.log(`DEBUG - Jogador: ${player.name}, Ativo: ${isActive}, Selecionado: ${wasSelected}`);
                    
                    if (isActive && !wasSelected) {
                        const oldFaults = player.faults || 0;
                        player.faults = oldFaults + 1;
                        console.log(`DEBUG - ${player.name}: faltas ${oldFaults} -> ${player.faults}`);
                    }
                });
                
                console.log('DEBUG - Estado final dos jogadores:', state.players.map(p => ({ name: p.name, faults: p.faults })));
                
                // Adicionar ao histórico local
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
                
                // Reativar sincronização automática após distribuição bem-sucedida
                isDistributionInProgress = false;
                
                // Forçar sincronização imediata para garantir que a visualização seja atualizada
                setTimeout(async () => {
                    await checkForUpdates();
                    renderTable(); // Garantir que a tabela seja re-renderizada com dados atualizados
                    renderDashboard(); // Atualizar dashboard também
                }, 1000);
                
                // Mostrar modal de resultados
                showResultsModal(assignments, distributionSummary);
                
                // Fechar modal de distribuição
                closeModal();
                
            } catch (error) {
                console.error('Erro na distribuição:', error);
                showToast('Erro ao processar distribuição: ' + error.message, 'error');
                // Reativar sincronização automática em caso de erro
                isDistributionInProgress = false;
                return;
            }
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

// Sistema de sincronização em tempo real
let lastSyncTimestamp = null;
let syncInterval = null;
let isCheckingUpdates = false;
let isDistributionInProgress = false;

function initRealtimeSync() {
  console.log('Iniciando sincronização em tempo real com Supabase...');
  
  // Inicializar gerenciador de realtime do Supabase
  const realtimeManager = getRealtimeManager();
  
  if (!realtimeManager) {
    console.warn('⚠️ Gerenciador de realtime não disponível, usando fallback para polling');
    // Fallback para polling se Supabase não estiver disponível
    syncInterval = setInterval(checkForUpdates, 5000);
    setTimeout(checkForUpdates, 1000);
    return;
  }
  
  // Subscrever mudanças nas tabelas
  realtimeManager.subscribeToPlayers((payload) => {
    console.log('🔄 Mudança detectada na tabela players:', payload);
    handlePlayersChange(payload);
  });
  
  realtimeManager.subscribeToItems((payload) => {
    console.log('🔄 Mudança detectada na tabela items:', payload);
    handleItemsChange(payload);
  });
  
  realtimeManager.subscribeToHistory((payload) => {
    console.log('🔄 Mudança detectada na tabela history:', payload);
    handleHistoryChange(payload);
  });
  
  realtimeManager.subscribeToPlayerSelections((payload) => {
    console.log('🔄 Mudança detectada na tabela player_selections:', payload);
    handlePlayerSelectionsChange(payload);
  });
  
  // Verificação inicial para carregar dados
  setTimeout(checkForUpdates, 1000);
  
  console.log('✅ Realtime subscriptions configuradas');
}

async function checkForUpdates() {
  if (isCheckingUpdates || isDistributionInProgress) return;
  
  try {
    isCheckingUpdates = true;
    
    const response = await fetch('/.netlify/functions/supabase-api/check-updates', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Verificar se há mudanças baseado no timestamp
      if (data.last_updated && data.last_updated !== lastSyncTimestamp) {
        console.log('Mudanças detectadas, atualizando interface...');
        
        if (data.state) {
          // Preservar configurações de UI
          const currentUI = state.ui;
          
          // Atualizar estado com novos dados
          state = data.state;
          state.ui = currentUI;
          
          // Garantir propriedades necessárias
          if (!state.rotation) state.rotation = {};
          if (!state.ui) state.ui = { editUnlocked: false };
          
          // Garantir flag active e inicializar faltas
          if (state.players) {
            state.players.forEach((p) => { 
              if (typeof p.active === 'undefined') p.active = true;
              if (typeof p.faults === 'undefined') p.faults = 0;
            });
          }
          
          // Atualizar interface apenas se não estiver em processo de distribuição
          renderItemsSelect();
          renderPlayersManager();
          renderItemsManager();
          renderTable();
          
          // Só renderizar histórico se não estiver com modal de distribuição ou resultados aberto
          const distributeModal = document.getElementById('distribute-modal');
          const resultsModal = document.getElementById('results-modal');
          const isDistributeModalOpen = distributeModal && distributeModal.classList.contains('show');
          const isResultsModalOpen = resultsModal && resultsModal.classList.contains('show');
          
          if (!isDistributeModalOpen && !isResultsModalOpen) {
            renderHistory();
          }
          
          // Mostrar notificação discreta apenas se houve mudanças significativas
          const hasSignificantChanges = (
            JSON.stringify(state.players) !== JSON.stringify(window.lastKnownPlayers) ||
            JSON.stringify(state.items) !== JSON.stringify(window.lastKnownItems) ||
            state.history.length !== (window.lastKnownHistoryLength || 0)
          );
          
          if (hasSignificantChanges) {
            showToast('Dados atualizados automaticamente', 'success');
            
            // Armazenar estado atual para próxima comparação
            window.lastKnownPlayers = JSON.parse(JSON.stringify(state.players));
            window.lastKnownItems = JSON.parse(JSON.stringify(state.items));
            window.lastKnownHistoryLength = state.history.length;
          }
        }
        
        lastSyncTimestamp = data.last_updated;
      }
    }
  } catch (error) {
    console.warn('Erro na verificação automática:', error);
  } finally {
    isCheckingUpdates = false;
  }
}

function stopRealtimeSync() {
  // Parar polling se estiver ativo
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('Polling de sincronização parado');
  }
  
  // Remover subscriptions do Supabase
  const realtimeManager = getRealtimeManager();
  if (realtimeManager) {
    realtimeManager.unsubscribeAll();
    console.log('✅ Todas as subscriptions do Supabase removidas');
  }
  
  console.log('Sincronização em tempo real parada');
}

// Funções de callback para mudanças em tempo real
function handlePlayersChange(payload) {
  console.log('🔄 Processando mudança na tabela players:', payload.eventType);
  
  // Recarregar dados dos jogadores
  checkForUpdates();
}

function handleItemsChange(payload) {
  console.log('🔄 Processando mudança na tabela items:', payload.eventType);
  
  // Recarregar dados dos itens
  checkForUpdates();
}

function handleHistoryChange(payload) {
  console.log('🔄 Processando mudança na tabela history:', payload.eventType);
  
  // Recarregar dados do histórico
  checkForUpdates();
}

function handlePlayerSelectionsChange(payload) {
  console.log('🔄 Processando mudança na tabela player_selections:', payload.eventType);
  
  // Recarregar seleções de jogadores
  if (typeof loadPlayerSelectionFromStorage === 'function') {
    loadPlayerSelectionFromStorage();
  }
}

// Parar sincronização quando a página for fechada
window.addEventListener('beforeunload', stopRealtimeSync);

document.addEventListener("DOMContentLoaded", async () => {
  loadCustomIcons();
  await preloadDefaultIcons();
  main();
  initItemsTableEvents();
  await initPlayerSelectionSync();
});

// Inicializar eventos da tabela de itens
function initItemsTableEvents() {
  const markAllItemsBtn = document.getElementById('btn-mark-all-items');
  const unmarkAllItemsBtn = document.getElementById('btn-unmark-all-items');
  
  if (markAllItemsBtn) {
    markAllItemsBtn.addEventListener('click', () => {
      state.items.forEach(item => selectedDistributionItems.add(item));
      renderItemsTable();
      renderItemsList(); // Atualizar modal também
    });
  }
  
  if (unmarkAllItemsBtn) {
    unmarkAllItemsBtn.addEventListener('click', () => {
      selectedDistributionItems.clear();
      renderItemsTable();
      renderItemsList(); // Atualizar modal também
    });
  }
}

// Função para sincronizar seleção de jogadores com Supabase
async function initPlayerSelectionSync() {
  // Carregar estado inicial do Supabase
  await loadPlayerSelectionFromStorage();
  
  // Escutar mudanças no localStorage (para sincronizar entre abas)
  window.addEventListener('storage', (e) => {
    if (e.key === 'adminTableState' || e.key === 'guildDistributionState') {
      loadPlayerSelectionFromStorage();
      // Recarregar estado se mudou
      if (e.key === 'guildDistributionState') {
        loadState().then(() => renderTable());
      }
    }
  });
  
  // Escutar eventos customizados (para sincronizar na mesma aba)
  window.addEventListener('playerSelectionChanged', (e) => {
    loadPlayerSelectionFromStorage();
    // Atualizar estado local do jogador
    if (e.detail && e.detail.playerName) {
      const player = state.players.find(p => p.name === e.detail.playerName);
      if (player) {
        player.active = e.detail.selected;
        saveState(state);
        renderTable();
      }
    }
  });
}

// Função para carregar seleção de jogadores do localStorage
async function loadPlayerSelectionFromStorage() {
  try {
    console.log('DEBUG - Carregando seleções do Supabase...');
    
    // Buscar seleções do Supabase
    const response = await fetch('/.netlify/functions/supabase-api/player-selections');
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar seleções');
    }
    
    const selectedPlayers = result.data.map(selection => selection.player_name);
    console.log('DEBUG - Seleções carregadas do Supabase:', selectedPlayers);
    
    // Remover dependência do localStorage para seleções de jogadores
    // Agora usando apenas Supabase como fonte única da verdade
    
    // Aguardar um pouco para garantir que a tabela foi renderizada
    setTimeout(() => {
      // Marcar checkboxes dos jogadores selecionados
      document.querySelectorAll('#players-table tbody tr').forEach(row => {
        const playerName = row.getAttribute('data-name');
        const checkbox = row.querySelector('input[type="checkbox"]');
        
        if (checkbox && playerName) {
          const shouldBeChecked = selectedPlayers.includes(playerName);
          console.log(`DEBUG - Jogador: ${playerName}, Deveria estar marcado: ${shouldBeChecked}, Está marcado: ${checkbox.checked}`);
          
          if (checkbox.checked !== shouldBeChecked) {
            checkbox.checked = shouldBeChecked;
            
            // Atualizar o estado do jogador no state local
            const player = state.players.find(p => p.name === playerName);
            if (player) {
              player.active = shouldBeChecked;
              console.log(`DEBUG - Atualizando estado do jogador ${playerName} para: ${shouldBeChecked}`);
            }
          }
        }
      });
      
      // Salvar estado após sincronização
      saveState(state);
    }, 100);
    
  } catch (error) {
    console.error('Erro ao carregar seleção de jogadores do Supabase:', error);
    
    // Se a tabela não existe, desabilitar funcionalidade temporariamente
    if (error.message && (error.message.includes('player_selections') || error.message.includes('404'))) {
      console.warn('⚠️ Tabela player_selections não encontrada. Funcionalidade desabilitada temporariamente.');
      // Não mostrar toast de erro para não incomodar o usuário
      return;
    }
    
    showToast('Erro ao carregar seleções: ' + error.message, 'error');
    
    // Fallback para localStorage em caso de erro
    try {
      const adminTableState = JSON.parse(localStorage.getItem('adminTableState') || '{}');
      const selectedPlayers = adminTableState.selectedPlayers || [];
      console.log('DEBUG - Fallback para localStorage:', selectedPlayers);
    } catch (fallbackError) {
      console.error('Erro no fallback para localStorage:', fallbackError);
    }
  }
}

// Função para salvar seleção de jogadores no Supabase
// Função para atualizar status do jogador no Supabase
async function updatePlayerStatusInSupabase(playerName, active) {
  try {
    console.log(`Atualizando status do jogador ${playerName} para ${active ? 'presente' : 'ausente'}`);
    
    const response = await fetch('/.netlify/functions/supabase-api/players/status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        playerName: playerName,
        active: active
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Status do jogador atualizado no Supabase:', result);
    
    return result;
  } catch (error) {
    console.error('Erro ao atualizar status do jogador no Supabase:', error);
    throw error;
  }
}

async function savePlayerSelectionToStorage() {
  try {
    const selectedPlayers = [];
    const playerSelections = {};
    const selectionsToUpdate = [];
    
    document.querySelectorAll('#players-table tbody tr').forEach(row => {
      const playerName = row.getAttribute('data-name');
      const checkbox = row.querySelector('input[type="checkbox"]');
      
      if (checkbox && playerName) {
        const isSelected = checkbox.checked;
        if (isSelected) {
          selectedPlayers.push(playerName);
          playerSelections[playerName] = true;
        }
        
        // Preparar dados para atualização no Supabase
        selectionsToUpdate.push({
          player_name: playerName,
          is_selected: isSelected,
          selected_by: 'admin', // Identificar que foi selecionado pelo admin
          selected_at: new Date().toISOString()
        });
      }
    });
    
    // Salvar no Supabase
    console.log('Salvando seleções no Supabase:', selectionsToUpdate);
    
    const response = await fetch('/.netlify/functions/supabase-api/player-selections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ selections: selectionsToUpdate })
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Seleções salvas no Supabase:', result);
    
    // Remover dependência do localStorage para seleções de jogadores
    // Dados agora são gerenciados exclusivamente pelo Supabase
    
    // Disparar evento para notificar mudanças
    window.dispatchEvent(new CustomEvent('playerSelectionChanged', {
      detail: { selectedPlayers: selectedPlayers, playerSelections: playerSelections }
    }));
    
    console.log('Seleções de jogadores salvas no Supabase e localStorage:', selectedPlayers);
    
  } catch (error) {
    console.error('Erro ao salvar seleção de jogadores no Supabase:', error);
    
    // Se a tabela não existe, desabilitar funcionalidade temporariamente
    if (error.message && (error.message.includes('player_selections') || error.message.includes('404'))) {
      console.warn('⚠️ Tabela player_selections não encontrada. Funcionalidade desabilitada temporariamente.');
      // Não mostrar toast de erro para não incomodar o usuário
      return;
    }
    
    showToast('Erro ao salvar seleções: ' + error.message, 'error');
  }
}

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
document.addEventListener("DOMContentLoaded", async () => {
  initToggleEdit();
  await initItemReleaseSystem();
});

// ===== SISTEMA DE LIBERAÇÃO DE ITENS =====

// Estado global para itens liberados
let releasedItems = new Map(); // Map<itemName, quantity>
let playerSelections = new Map(); // Map<playerName, Set<itemName>>

// Inicializar sistema de liberação de itens
async function initItemReleaseSystem() {
  const btnSelectItems = document.getElementById('btn-select-items');
  const btnDistributeItems = document.getElementById('btn-distribute-items');
  const btnReleaseItems = document.getElementById('btn-release-items');
  
  if (btnSelectItems) {
    btnSelectItems.addEventListener('click', openItemSelectionModal);
  }
  
  if (btnDistributeItems) {
    btnDistributeItems.addEventListener('click', distributeReleasedItems);
  }
  
  if (btnReleaseItems) {
    btnReleaseItems.addEventListener('click', releaseSelectedItems);
  }
  
  // Carregar dados salvos
  await loadReleasedItems();
  await loadPlayerSelections();
  updateDistributeButtonState();
  renderPlayerSelectionsLog();
  renderReleasedItems();
  
  // Inicializar subscriptions em tempo real
  initRealtimeItemReleaseSubscriptions();
}

// Abrir modal de seleção de itens
function openItemSelectionModal() {
  const modal = document.getElementById('item-selection-modal');
  const itemList = document.getElementById('item-selection-list');
  
  // Limpar lista
  itemList.innerHTML = '';
  
  // Carregar itens disponíveis
  state.items.forEach(itemName => {
    const row = document.createElement('div');
    row.className = 'item-selection-row';
    
    const currentQuantity = releasedItems.get(itemName) || 0;
    const isSelected = currentQuantity > 0;
    
    if (isSelected) {
      row.classList.add('selected');
    }
    
    row.innerHTML = `
      <div class="item-info">
        <input type="checkbox" class="item-checkbox" ${isSelected ? 'checked' : ''} 
               onchange="toggleItemInModal('${itemName}', this)">
        <span class="item-name">${itemName}</span>
      </div>
      <input type="number" class="quantity-input" min="1" max="99" value="${currentQuantity || 1}"
             onchange="updateItemQuantityInModal('${itemName}', this.value)">
    `;
    
    itemList.appendChild(row);
  });
  
  modal.style.display = 'block';
}

// Fechar modal de seleção de itens
function closeItemSelectionModal() {
  const modal = document.getElementById('item-selection-modal');
  modal.style.display = 'none';
}

// Alternar seleção de item no modal
function toggleItemInModal(itemName, checkbox) {
  const row = checkbox.closest('.item-selection-row');
  const quantityInput = row.querySelector('.quantity-input');
  
  if (checkbox.checked) {
    row.classList.add('selected');
    quantityInput.disabled = false;
  } else {
    row.classList.remove('selected');
    quantityInput.disabled = true;
  }
}

// Atualizar quantidade de item no modal
function updateItemQuantityInModal(itemName, quantity) {
  const qty = parseInt(quantity) || 1;
  const input = event.target;
  input.value = Math.max(1, Math.min(99, qty));
}

// Liberar itens selecionados
async function releaseSelectedItems() {
  const modal = document.getElementById('item-selection-modal');
  const selectedRows = modal.querySelectorAll('.item-selection-row.selected');
  
  try {
    // Obter cliente Supabase
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      showToast('Erro: Cliente Supabase não disponível', 'error');
      return;
    }
    
    // Limpar itens liberados anteriores no Supabase
    const { error: deleteError } = await supabaseClient
      .from('released_items')
      .delete()
      .eq('status', 'active');
    
    if (deleteError) {
      console.error('Erro ao limpar itens anteriores:', deleteError);
    }
    
    // Limpar itens liberados locais
    releasedItems.clear();
    
    // Coletar e salvar itens selecionados no Supabase
    const itemsToInsert = [];
    selectedRows.forEach(row => {
      const checkbox = row.querySelector('.item-checkbox');
      const quantityInput = row.querySelector('.quantity-input');
      const itemName = row.querySelector('.item-name').textContent;
      
      if (checkbox.checked) {
        const quantity = parseInt(quantityInput.value) || 1;
        releasedItems.set(itemName, quantity);
        
        // Preparar para inserção no Supabase
        itemsToInsert.push({
          item_name: itemName,
          quantity: quantity,
          released_by: 'Admin', // Pode ser personalizado
          status: 'active'
        });
      }
    });
    
    // Inserir itens no Supabase
    if (itemsToInsert.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('released_items')
        .insert(itemsToInsert);
      
      if (insertError) {
        console.error('Erro ao salvar itens no Supabase:', insertError);
        showToast('Erro ao salvar itens no banco de dados', 'error');
        return;
      }
    }
    
    // Atualizar interface
    updateDistributeButtonState();
    renderReleasedItems();
    
    // Fechar modal
    closeItemSelectionModal();
    
    // Mostrar toast
    const itemCount = releasedItems.size;
    const totalQuantity = Array.from(releasedItems.values()).reduce((sum, qty) => sum + qty, 0);
    showToast(`${itemCount} tipos de itens liberados (${totalQuantity} itens no total)`, 'success');
    
    // Limpar seleções dos jogadores no localStorage (novos itens disponíveis)
    playerSelections.clear();
    savePlayerSelections();
    renderPlayerSelectionsLog();
    
    // Limpar seleções antigas no Supabase para que jogadores possam escolher novamente
    try {
      const { error: clearError } = await supabaseClient
        .from('player_item_selections')
        .delete()
        .eq('status', 'pending');
      
      if (clearError) {
        console.warn('Aviso ao limpar seleções antigas:', clearError);
      } else {
        console.log('✅ Seleções antigas limpas do Supabase');
      }
    } catch (error) {
      console.warn('Aviso ao limpar seleções antigas:', error);
    }
    
  } catch (error) {
    console.error('Erro ao liberar itens:', error);
    showToast('Erro ao liberar itens', 'error');
  }
}



// Salvar seleções dos jogadores
function savePlayerSelections() {
  const data = Array.from(playerSelections.entries()).map(([player, items]) => [
    player,
    Array.from(items)
  ]);
  localStorage.setItem('playerSelections', JSON.stringify(data));
}

// Carregar seleções dos jogadores
async function loadPlayerSelections() {
  try {
    // Buscar seleções do Supabase
    const response = await fetch('/.netlify/functions/supabase-api/player-selections');
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar seleções');
    }
    
    // Organizar dados por jogador
    playerSelections = new Map();
    result.data.forEach(selection => {
      if (!playerSelections.has(selection.player_name)) {
        playerSelections.set(selection.player_name, new Set());
      }
      playerSelections.get(selection.player_name).add(selection.item_name);
    });
    
    console.log('✅ Seleções carregadas do Supabase:', playerSelections);
    
  } catch (error) {
    console.error('Erro ao carregar seleções dos jogadores:', error);
    playerSelections = new Map();
  }
}

// Carregar itens liberados do Supabase
async function loadReleasedItems() {
  try {
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) return;
    
    const { data, error } = await supabaseClient
      .from('released_items')
      .select('*')
      .eq('status', 'active');
    
    if (error) {
      console.error('Erro ao carregar itens liberados:', error);
      return;
    }
    
    // Limpar e recarregar itens liberados
    releasedItems.clear();
    if (data) {
      data.forEach(item => {
        releasedItems.set(item.item_name, item.quantity);
      });
    }
  } catch (error) {
    console.error('Erro ao carregar itens liberados:', error);
  }
}

// Renderizar itens liberados na interface
function renderReleasedItems() {
  const displaySection = document.getElementById('released-items-display');
  const itemsList = document.getElementById('released-items-list');
  
  if (!displaySection || !itemsList) return;
  
  if (releasedItems.size === 0) {
    displaySection.style.display = 'none';
    return;
  }
  
  displaySection.style.display = 'block';
  
  let html = '';
  for (const [itemName, quantity] of releasedItems) {
    html += `
      <div class="released-item">
        <span class="released-item-name">${itemName}</span>
        <span class="released-item-quantity">${quantity}x</span>
      </div>
    `;
  }
  
  itemsList.innerHTML = html;
}

// Atualizar estado do botão distribuir
function updateDistributeButtonState() {
  const btnDistribute = document.getElementById('btn-distribute-items');
  if (btnDistribute) {
    const hasReleasedItems = releasedItems.size > 0;
    const hasPlayerSelections = playerSelections.size > 0;
    
    btnDistribute.disabled = !hasReleasedItems || !hasPlayerSelections;
    
    if (!hasReleasedItems) {
      btnDistribute.title = 'Nenhum item foi liberado ainda';
    } else if (!hasPlayerSelections) {
      btnDistribute.title = 'Nenhum jogador fez seleções ainda';
    } else {
      btnDistribute.title = 'Executar distribuição';
    }
  }
}

// Renderizar log de seleções dos jogadores
function renderPlayerSelectionsLog() {
  const logContainer = document.getElementById('player-selections-log');
  if (!logContainer) return;
  
  if (playerSelections.size === 0) {
    logContainer.innerHTML = '<p class="no-selections">Nenhuma seleção de jogador registrada ainda.</p>';
    return;
  }
  
  let html = '';
  for (const [playerName, selectedItems] of playerSelections) {
    for (const itemName of selectedItems) {
      html += `
        <div class="selection-entry">
          <div>
            <span class="selection-player">${playerName}</span>
            <span> escolheu </span>
            <span class="selection-item">${itemName}</span>
          </div>
          <div class="selection-time">${new Date().toLocaleTimeString()}</div>
        </div>
      `;
    }
  }
  
  logContainer.innerHTML = html;
}

// Registrar seleção de jogador (chamada pelo painel do jogador)
function registerPlayerSelection(playerName, itemName) {
  if (!playerSelections.has(playerName)) {
    playerSelections.set(playerName, new Set());
  }
  
  playerSelections.get(playerName).add(itemName);
  savePlayerSelections();
  renderPlayerSelectionsLog();
  updateDistributeButtonState();
}

// Remover seleção de jogador
function removePlayerSelection(playerName, itemName) {
  if (playerSelections.has(playerName)) {
    playerSelections.get(playerName).delete(itemName);
    
    // Remover jogador se não tem mais seleções
    if (playerSelections.get(playerName).size === 0) {
      playerSelections.delete(playerName);
    }
    
    savePlayerSelections();
    renderPlayerSelectionsLog();
    updateDistributeButtonState();
  }
}

// Distribuir itens liberados
async function distributeReleasedItems() {
  if (releasedItems.size === 0) {
    showToast('Nenhum item foi liberado ainda', 'warning');
    return;
  }
  
  if (playerSelections.size === 0) {
    showToast('Nenhum jogador fez seleções ainda', 'warning');
    return;
  }
  
  try {
    const distributions = calculateDistributions();
    
    if (distributions.length === 0) {
      showToast('Nenhuma distribuição possível com as seleções atuais', 'warning');
      return;
    }
    
    // Mostrar prévia da distribuição
    showDistributionPreview(distributions);
    
  } catch (error) {
    console.error('Erro na distribuição:', error);
    showToast('Erro ao processar distribuição: ' + error.message, 'error');
  }
}

// Limpar tabelas do Supabase após distribuição
async function cleanupAfterDistribution() {
  try {
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      console.warn('Cliente Supabase não disponível para limpeza');
      return;
    }
    
    // Limpar tabela released_items
    const { error: releasedItemsError } = await supabaseClient
      .from('released_items')
      .delete()
      .eq('status', 'active');
    
    if (releasedItemsError) {
      console.error('Erro ao limpar released_items:', releasedItemsError);
    } else {
      console.log('Tabela released_items limpa com sucesso');
    }
    
    // Limpar tabela player_item_selections
    const { error: selectionsError } = await supabaseClient
      .from('player_item_selections')
      .delete()
      .eq('status', 'active');
    
    if (selectionsError) {
      console.error('Erro ao limpar player_item_selections:', selectionsError);
    } else {
      console.log('Tabela player_item_selections limpa com sucesso');
    }
    
  } catch (error) {
    console.error('Erro na limpeza pós-distribuição:', error);
  }
}

// Calcular distribuições baseado na fila de prioridade
function calculateDistributions() {
  const distributions = [];
  
  console.log('🎯 Iniciando cálculo de distribuições...');
  console.log('📦 Itens liberados:', Array.from(releasedItems.entries()));
  console.log('👥 Seleções dos jogadores:', Array.from(playerSelections.entries()).map(([name, items]) => [name, Array.from(items)]));
  
  // Para cada item liberado
  for (const [itemName, quantity] of releasedItems) {
    console.log(`\n🔍 Processando item: ${itemName} (quantidade: ${quantity})`);
    
    // Obter jogadores que selecionaram este item
    const interestedPlayers = [];
    for (const [playerName, selectedItems] of playerSelections) {
      if (selectedItems.has(itemName)) {
        // Buscar jogador no estado, considerando que pode não estar no state.players
        let player = state.players.find(p => p.name === playerName);
        
        // Se não encontrou no state.players, criar um jogador temporário
        if (!player) {
          player = {
            name: playerName,
            active: true,
            counts: {}
          };
          // Inicializar counts para todos os itens
          for (const itemName of state.items) {
            player.counts[itemName] = 0;
          }
          console.log(`⚠️ Jogador ${playerName} não encontrado no estado, criando temporário`);
        }
        
        // Só adicionar se o jogador estiver ativo
        if (player.active !== false) {
          interestedPlayers.push({
            ...player,
            currentItemCount: player.counts[itemName] || 0,
            queuePosition: state.players.findIndex(p => p.name === playerName)
          });
          console.log(`✅ Jogador ${playerName} interessado - quantidade atual: ${player.counts[itemName] || 0}`);
        } else {
          console.log(`❌ Jogador ${playerName} inativo, ignorando`);
        }
      }
    }
    
    if (interestedPlayers.length === 0) {
      console.log(`⚠️ Nenhum jogador interessado em ${itemName}`);
      continue;
    }
    
    console.log(`👥 ${interestedPlayers.length} jogadores interessados em ${itemName}`);
    
    // Ordenar por prioridade:
    // 1. Menor quantidade do item atual
    // 2. Posição na fila (ordem de cadastro)
    interestedPlayers.sort((a, b) => {
      // Primeiro critério: menor quantidade do item
      if (a.currentItemCount !== b.currentItemCount) {
        return a.currentItemCount - b.currentItemCount;
      }
      
      // Segundo critério: posição na fila (ordem de cadastro)
      // Jogadores não encontrados no estado vão para o final
      const aPos = a.queuePosition === -1 ? 9999 : a.queuePosition;
      const bPos = b.queuePosition === -1 ? 9999 : b.queuePosition;
      return aPos - bPos;
    });
    
    console.log('📋 Ordem de prioridade:', interestedPlayers.map(p => 
      `${p.name} (${p.currentItemCount} itens, posição ${p.queuePosition === -1 ? 'nova' : p.queuePosition})`
    ));
    
    // Distribuir quantidade disponível de forma equitativa
    let remainingQuantity = quantity;
    let round = 0;
    
    while (remainingQuantity > 0 && interestedPlayers.length > 0) {
      console.log(`🔄 Rodada ${round + 1} - restam ${remainingQuantity} itens`);
      
      // Em cada rodada, dar 1 item para cada jogador (até acabar os itens)
      for (let i = 0; i < interestedPlayers.length && remainingQuantity > 0; i++) {
        const player = interestedPlayers[i];
        
        distributions.push({
          item: itemName,
          player: player.name,
          quantity: 1
        });
        
        console.log(`➡️ ${player.name} recebe 1x ${itemName}`);
        
        // Atualizar contagem temporária para próximas rodadas
        player.currentItemCount++;
        remainingQuantity--;
      }
      
      // Reordenar para próxima rodada baseado na nova contagem
      interestedPlayers.sort((a, b) => {
        if (a.currentItemCount !== b.currentItemCount) {
          return a.currentItemCount - b.currentItemCount;
        }
        const aPos = a.queuePosition === -1 ? 9999 : a.queuePosition;
        const bPos = b.queuePosition === -1 ? 9999 : b.queuePosition;
        return aPos - bPos;
      });
      
      round++;
      
      // Evitar loop infinito
      if (round > 100) {
        console.error('⚠️ Muitas rodadas, interrompendo distribuição');
        break;
      }
    }
  }
  
  console.log('✅ Distribuições calculadas:', distributions);
  return distributions;
}

// Aplicar distribuições via API
async function applyDistributions(distributions) {
  // Agrupar distribuições por jogador e item
  const distributionMap = new Map();
  
  distributions.forEach(({ item, player, quantity }) => {
    const key = `${player}:${item}`;
    if (!distributionMap.has(key)) {
      distributionMap.set(key, { player_name: player, item_name: item, quantity: 0 });
    }
    distributionMap.get(key).quantity += quantity;
  });
  
  const distributionsForAPI = Array.from(distributionMap.values()).map(dist => ({
    ...dist,
    notes: `Distribuição automática por liberação - ${fmtDate()}`
  }));
  
  // Enviar para API
  const response = await fetch('/.netlify/functions/supabase-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'distribute',
      data: {
        distributions: distributionsForAPI,
        selectedPlayers: state.players.filter(p => p.active).map(p => p.name)
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Erro desconhecido na distribuição');
  }
  
  // Atualizar estado local
  distributionsForAPI.forEach(({ player_name, item_name, quantity }) => {
    const player = state.players.find(p => p.name === player_name);
    if (player) {
      player.counts[item_name] = (player.counts[item_name] || 0) + quantity;
      player.total_received = (player.total_received || 0) + quantity;
    }
  });
  
  // Salvar estado
  await saveState(state);
}

// Obter itens liberados (para uso no painel do jogador)
function getReleasedItems() {
  return Array.from(releasedItems.entries());
}

// Verificar se jogador já selecionou item
function hasPlayerSelectedItem(playerName, itemName) {
  return playerSelections.has(playerName) && playerSelections.get(playerName).has(itemName);
}

// Expor funções globalmente para uso em outros arquivos
// Mostrar prévia da distribuição
function showDistributionPreview(distributions) {
  const modal = document.getElementById('distribution-preview-modal');
  if (!modal) {
    console.error('Modal de prévia da distribuição não encontrado');
    return;
  }
  
  const previewContent = document.getElementById('distribution-preview-content');
  if (!previewContent) {
    console.error('Conteúdo da prévia não encontrado');
    return;
  }
  
  // Agrupar distribuições por jogador
  const playerDistributions = {};
  distributions.forEach(dist => {
    if (!playerDistributions[dist.player]) {
      playerDistributions[dist.player] = [];
    }
    playerDistributions[dist.player].push(dist);
  });
  
  // Gerar HTML da prévia
  let html = `
    <div class="distribution-summary">
      <h3>📋 Prévia da Distribuição</h3>
      <p><strong>Total de itens a distribuir:</strong> ${distributions.length}</p>
      <p><strong>Jogadores contemplados:</strong> ${Object.keys(playerDistributions).length}</p>
    </div>
    <div class="distribution-details">
  `;
  
  Object.entries(playerDistributions).forEach(([playerName, playerDists]) => {
    html += `
      <div class="player-distribution">
        <h4>🎮 ${playerName}</h4>
        <ul>
    `;
    
    playerDists.forEach(dist => {
      html += `<li>${dist.quantity}x ${dist.item}</li>`;
    });
    
    html += `
        </ul>
      </div>
    `;
  });
  
  html += `
    </div>
    <div class="distribution-actions">
      <button id="confirm-distribution" class="btn btn-success">✅ Confirmar Distribuição</button>
      <button id="cancel-distribution" class="btn btn-secondary">❌ Cancelar</button>
    </div>
  `;
  
  previewContent.innerHTML = html;
  
  // Configurar eventos dos botões
  document.getElementById('confirm-distribution').addEventListener('click', async () => {
    modal.style.display = 'none';
    await executeDistribution(distributions);
  });
  
  document.getElementById('cancel-distribution').addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  // Mostrar modal
  modal.style.display = 'block';
}

// Executar a distribuição após confirmação
async function executeDistribution(distributions) {
  try {
    // Aplicar distribuições
    await applyDistributions(distributions);
    
    // Limpar tabelas do Supabase após distribuição
    await cleanupAfterDistribution();
    
    // Limpar itens liberados e seleções locais após distribuição
    releasedItems.clear();
    playerSelections.clear();
    savePlayerSelections();
    
    // Atualizar interface
    renderPlayerSelectionsLog();
    updateDistributeButtonState();
    
    showToast(`Distribuição realizada com sucesso! ${distributions.length} itens distribuídos`, 'success');
    
  } catch (error) {
    console.error('Erro na distribuição:', error);
    showToast('Erro ao processar distribuição: ' + error.message, 'error');
  }
}

// Variáveis para subscriptions em tempo real
let releasedItemsSubscription = null;
let playerSelectionsSubscription = null;

// Inicializar subscriptions em tempo real
function initRealtimeItemReleaseSubscriptions() {
  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) {
    console.warn('Cliente Supabase não disponível para subscriptions em tempo real');
    return;
  }

  console.log('🔄 Inicializando subscriptions em tempo real...');

  // Subscription para released_items
  releasedItemsSubscription = supabaseClient
    .channel('released_items_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'released_items'
    }, (payload) => {
      console.log('📦 Mudança em released_items:', payload);
      handleReleasedItemsChange(payload);
    })
    .on('subscribe', (status) => {
      console.log('📡 Status subscription released_items:', status);
    })
    .on('error', (error) => {
      console.error('❌ Erro subscription released_items:', error);
    })
    .subscribe((status) => {
      console.log('🎯 Subscription released_items status:', status);
    });

  // Subscription para player_item_selections
  playerSelectionsSubscription = supabaseClient
    .channel('player_selections_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'player_item_selections'
    }, (payload) => {
      console.log('👤 Mudança em player_item_selections:', payload);
      handlePlayerSelectionsRealtimeChange(payload);
    })
    .on('subscribe', (status) => {
      console.log('📡 Status subscription player_selections:', status);
    })
    .on('error', (error) => {
      console.error('❌ Erro subscription player_selections:', error);
    })
    .subscribe((status) => {
      console.log('🎯 Subscription player_selections status:', status);
    });

  console.log('✅ Subscriptions em tempo real configuradas');
}

// Manipular mudanças em released_items
async function handleReleasedItemsChange(payload) {
  console.log('Processando mudança em released_items:', payload);
  
  // Recarregar itens liberados
  await loadReleasedItems();
  
  // Atualizar interface
  renderReleasedItems();
  updateDistributeButtonState();
  
  // Mostrar notificação se necessário
  if (payload.eventType === 'INSERT') {
    showToast('Novos itens foram liberados!', 'success');
  } else if (payload.eventType === 'DELETE') {
    showToast('Itens foram removidos da liberação', 'info');
  }
}

// Manipular mudanças em player_item_selections
async function handlePlayerSelectionsRealtimeChange(payload) {
  console.log('Processando mudança em player_item_selections:', payload);
  
  // Recarregar seleções dos jogadores
  await loadPlayerSelections();
  
  // Atualizar interface
  renderPlayerSelectionsLog();
  updateDistributeButtonState();
  
  // Mostrar notificação se necessário
  if (payload.eventType === 'INSERT') {
    const playerName = payload.new?.player_name;
    const itemName = payload.new?.item_name;
    if (playerName && itemName) {
      showToast(`${playerName} selecionou ${itemName}`, 'info');
    }
  } else if (payload.eventType === 'DELETE') {
    const playerName = payload.old?.player_name;
    const itemName = payload.old?.item_name;
    if (playerName && itemName) {
      showToast(`${playerName} removeu seleção de ${itemName}`, 'info');
    }
  }
}

// Limpar subscriptions
function cleanupRealtimeSubscriptions() {
  if (releasedItemsSubscription) {
    releasedItemsSubscription.unsubscribe();
    releasedItemsSubscription = null;
  }
  
  if (playerSelectionsSubscription) {
    playerSelectionsSubscription.unsubscribe();
    playerSelectionsSubscription = null;
  }
  
  console.log('Subscriptions em tempo real limpas');
}

// Limpar subscriptions quando a página for fechada
window.addEventListener('beforeunload', cleanupRealtimeSubscriptions);

window.registerPlayerSelection = registerPlayerSelection;
window.removePlayerSelection = removePlayerSelection;
window.getReleasedItems = getReleasedItems;
window.hasPlayerSelectedItem = hasPlayerSelectedItem;
window.openItemSelectionModal = openItemSelectionModal;
window.closeItemSelectionModal = closeItemSelectionModal;
window.toggleItemInModal = toggleItemInModal;
window.updateItemQuantityInModal = updateItemQuantityInModal;
