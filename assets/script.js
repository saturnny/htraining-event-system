/*
  Script principal para o sistema de eventos HTraining.
  O código carrega e salva dados no localStorage por padrão. Para usar com
  Supabase, substitua as funções loadLots, saveLots, loadParticipants e
  saveParticipants conforme as instruções no README.
*/

(() => {
  /*
    Integração com Supabase

    Para conectar ao Supabase, defina as variáveis SUPABASE_URL e
    SUPABASE_ANON_KEY abaixo com os valores do seu projeto. O objeto
    supabaseClient será criado automaticamente quando o script da CDN
    @supabase/supabase-js for incluído no HTML. Caso esses valores não
    sejam fornecidos, o sistema continuará a utilizar localStorage.

    Exemplo de definição no HTML:
      <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
      <script src="assets/script.js"></script>

    Substitua 'YOUR_SUPABASE_URL' e 'YOUR_SUPABASE_ANON_KEY' no código
    abaixo pelos valores reais. Consulte o README para mais detalhes.
  */
  const SUPABASE_URL = 'YOUR_SUPABASE_URL';
  const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
  // Se as chaves estiverem definidas e a biblioteca estiver carregada,
  // criamos o cliente. Caso contrário supabaseClient permanece null e
  // o sistema usa localStorage.
  let supabaseClient = null;
  if (
    typeof window !== 'undefined' &&
    window.supabase &&
    SUPABASE_URL &&
    SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
    SUPABASE_ANON_KEY &&
    SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY'
  ) {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
  }

  // Carrega lotes. Se supabaseClient existir, busca do banco;
  // senão recorre ao localStorage com dados padrão.
  async function loadLots() {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('lots')
        .select('*');
      if (error) {
        console.error('Erro ao carregar lotes do Supabase:', error);
        return [];
      }
      // Garante que o array esteja ordenado por id
      return data.sort((a, b) => a.id - b.id);
    }
    // fallback: localStorage
    const stored = localStorage.getItem('lots');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Erro ao fazer parse dos lotes:', e);
      }
    }
    const defaultLots = [
      { id: 1, name: 'Lote 1', price: 0, limit: 50, status: 'open' },
      { id: 2, name: 'Lote 2', price: 0, limit: 50, status: 'closed' },
      { id: 3, name: 'Lote 3', price: 0, limit: 50, status: 'closed' },
    ];
    localStorage.setItem('lots', JSON.stringify(defaultLots));
    return defaultLots;
  }

  // Salva lotes. Se supabase estiver disponível, usa upsert;
  // caso contrário persiste no localStorage.
  async function saveLots(lots) {
    if (supabaseClient) {
      const { error } = await supabaseClient.from('lots').upsert(lots);
      if (error) {
        console.error('Erro ao salvar lotes no Supabase:', error);
      }
    } else {
      localStorage.setItem('lots', JSON.stringify(lots));
    }
  }

  // Carrega participantes: busca no Supabase se possível ou no localStorage
  async function loadParticipants() {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('participants')
        .select('*');
      if (error) {
        console.error('Erro ao carregar participantes do Supabase:', error);
        return [];
      }
      return data;
    }
    const stored = localStorage.getItem('participants');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Erro ao fazer parse dos participantes:', e);
      }
    }
    return [];
  }

  // Salva participantes: upsert na tabela ou localStorage
  async function saveParticipants(list) {
    if (supabaseClient) {
      const { error } = await supabaseClient
        .from('participants')
        .upsert(list);
      if (error) {
        console.error('Erro ao salvar participantes no Supabase:', error);
      }
    } else {
      localStorage.setItem('participants', JSON.stringify(list));
    }
  }

  // Remove participante pelo id no Supabase (usado para excluir)
  async function deleteParticipantById(id) {
    if (supabaseClient) {
      const { error } = await supabaseClient
        .from('participants')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('Erro ao excluir participante do Supabase:', error);
      }
    }
  }

  // Remove lote pelo id no Supabase
  async function deleteLotById(id) {
    if (supabaseClient) {
      const { error } = await supabaseClient
        .from('lots')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('Erro ao excluir lote do Supabase:', error);
      }
    }
  }

  // Inicializa a página de inscrição pública
  async function initRegistrationPage() {
    const lots = await loadLots();
    let participants = await loadParticipants();
    const lotSelect = document.getElementById('lot-select');
    const ticketSelect = document.getElementById('ticket-type');
    const form = document.getElementById('registration-form');
    const success = document.getElementById('success-message');
    const paymentBtn = document.getElementById('payment-button');

    // Preenche opções de lote apenas para lotes abertos
    lots.forEach((lot) => {
      if (lot.status === 'open') {
        const option = document.createElement('option');
        option.value = lot.id;
        option.textContent = `${lot.name} — R$ ${lot.price.toFixed(2)}`;
        lotSelect.appendChild(option);
      }
    });

    // Tipos de ingresso: pode ser estendido conforme necessidade
    ['Inteira', 'Meia'].forEach((type) => {
      const op = document.createElement('option');
      op.value = type;
      op.textContent = type;
      ticketSelect.appendChild(op);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      // Cria um novo participante
      const newParticipant = {
        id: Date.now(),
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        ticket_type: ticketSelect.value,
        lot_id: parseInt(lotSelect.value, 10),
        status: 'pending',
      };
      participants.push(newParticipant);
      await saveParticipants(participants);
      // Mostra mensagem de sucesso e oculta o formulário
      form.classList.add('hidden');
      success.classList.remove('hidden');
      paymentBtn.addEventListener('click', () => {
        window.location.href = 'payment.html';
      });
    });
  }

  // Inicializa a página de administração
  async function initAdminPage() {
    let lots = await loadLots();
    let participants = await loadParticipants();
    const lotsContainer = document.getElementById('lots-container');
    const addLotBtn = document.getElementById('add-lot');
    const tableBody = document.querySelector('#participants-table tbody');
    const filterStatus = document.getElementById('filter-status');

    // Renderiza os lotes na página
    function renderLots() {
      lotsContainer.innerHTML = '';
      lots.forEach((lot, index) => {
        const div = document.createElement('div');
        div.className = 'lot-item';
        div.dataset.index = index;
        div.innerHTML = `
          <h3>${lot.name}</h3>
          <label>Preço R$: <input type="number" min="0" value="${lot.price}" data-field="price"></label>
          <label>Limite: <input type="number" min="0" value="${lot.limit}" data-field="limit"></label>
          <label>Status:
            <select data-field="status">
              <option value="open"${lot.status === 'open' ? ' selected' : ''}>Aberto</option>
              <option value="closed"${lot.status === 'closed' ? ' selected' : ''}>Fechado</option>
            </select>
          </label>
          <button class="save-lot">Salvar</button>
          ${lots.length > 1 ? '<button class="delete-lot">Excluir</button>' : ''}
        `;
        lotsContainer.appendChild(div);
      });
    }

    // Renderiza a tabela de participantes, aplicando filtros de status quando selecionado
    function renderParticipantsTable() {
      tableBody.innerHTML = '';
      let filtered = participants;
      const statusFilter = filterStatus.value;
      if (statusFilter) {
        filtered = participants.filter((p) => p.status === statusFilter);
      }
      filtered.forEach((p) => {
        const lotName = lots.find((l) => l.id === p.lot_id)?.name || '';
        const tr = document.createElement('tr');
        tr.dataset.id = p.id;
        tr.innerHTML = `
          <td>${p.name}</td>
          <td>${p.email}</td>
          <td>${p.phone}</td>
          <td>${p.ticket_type}</td>
          <td>${lotName}</td>
          <td>${p.status}</td>
          <td>
            <button class="edit-participant">Editar</button>
            <button class="delete-participant">Excluir</button>
            ${p.status !== 'present' ? '<button class="check-participant">Check‑in</button>' : ''}
          </td>
        `;
        tableBody.appendChild(tr);
      });
    }

    // Lida com cliques dentro do container de lotes
    lotsContainer.addEventListener('click', async (e) => {
      const item = e.target.closest('.lot-item');
      if (!item) return;
      const index = parseInt(item.dataset.index, 10);
      if (e.target.classList.contains('save-lot')) {
        // Salvar alterações do lote
        const inputs = item.querySelectorAll('input, select');
        inputs.forEach((inp) => {
          const field = inp.dataset.field;
          let val = inp.value;
          if (field === 'price' || field === 'limit') {
            val = parseFloat(val);
          }
          lots[index][field] = val;
        });
        await saveLots(lots);
        alert('Lote salvo!');
      } else if (e.target.classList.contains('delete-lot')) {
        // Excluir lote se houver mais de um
        if (confirm('Tem certeza que deseja excluir este lote?')) {
          const toDelete = lots[index];
          lots.splice(index, 1);
          await deleteLotById(toDelete.id);
          await saveLots(lots);
          renderLots();
          // Após excluir um lote pode ser necessário atualizar participantes associados
          participants = await loadParticipants();
          renderParticipantsTable();
        }
      }
    });

    // Clique para adicionar novo lote
    addLotBtn.addEventListener('click', async () => {
      const nextIndex = lots.length + 1;
      const newLot = {
        id: Date.now(),
        name: `Lote ${nextIndex}`,
        price: 0,
        limit: 0,
        status: 'closed',
      };
      lots.push(newLot);
      await saveLots(lots);
      renderLots();
    });

    // Eventos da tabela de participantes
    tableBody.addEventListener('click', async (e) => {
      const tr = e.target.closest('tr');
      if (!tr) return;
      const participantId = parseInt(tr.dataset.id, 10);
      const pIndex = participants.findIndex((p) => p.id === participantId);
      if (e.target.classList.contains('delete-participant')) {
        if (confirm('Excluir este inscrito?')) {
          const toDelete = participants[pIndex];
          participants.splice(pIndex, 1);
          await deleteParticipantById(toDelete.id);
          await saveParticipants(participants);
          renderParticipantsTable();
        }
      } else if (e.target.classList.contains('check-participant')) {
        participants[pIndex].status = 'present';
        await saveParticipants(participants);
        renderParticipantsTable();
      } else if (e.target.classList.contains('edit-participant')) {
        const current = participants[pIndex];
        const newName = prompt('Nome:', current.name);
        const newEmail = prompt('E‑mail:', current.email);
        const newPhone = prompt('Telefone:', current.phone);
        if (newName && newEmail && newPhone) {
          current.name = newName.trim();
          current.email = newEmail.trim();
          current.phone = newPhone.trim();
          await saveParticipants(participants);
          renderParticipantsTable();
        }
      }
    });

    filterStatus.addEventListener('change', () => {
      renderParticipantsTable();
    });

    // Renderização inicial
    renderLots();
    renderParticipantsTable();
  }

  // Inicializa a página de check‑in
  async function initCheckinPage() {
    let participants = await loadParticipants();
    const tbody = document.querySelector('#checkin-table tbody');
    const searchInput = document.getElementById('search-input');
    // Renderiza a lista baseada no campo de busca
    function renderList() {
      tbody.innerHTML = '';
      const query = searchInput.value.toLowerCase().trim();
      participants.forEach((p) => {
        if (
          p.name.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query)
        ) {
          const tr = document.createElement('tr');
          tr.dataset.id = p.id;
          tr.innerHTML = `
            <td>${p.name}</td>
            <td>${p.email}</td>
            <td>${p.phone}</td>
            <td>${p.status}</td>
            <td>${p.status !== 'present' ? '<button class="check-btn">Check‑in</button>' : ''}</td>
          `;
          tbody.appendChild(tr);
        }
      });
    }
    renderList();
    searchInput.addEventListener('input', renderList);
    tbody.addEventListener('click', async (e) => {
      if (e.target.classList.contains('check-btn')) {
        const tr = e.target.closest('tr');
        const id = parseInt(tr.dataset.id, 10);
        const index = participants.findIndex((p) => p.id === id);
        participants[index].status = 'present';
        await saveParticipants(participants);
        renderList();
        // Exibe mensagem de confirmação
        const msgEl = document.getElementById('checkin-message');
        if (msgEl) {
          msgEl.textContent = `${participants[index].name} marcado como presente.`;
          msgEl.classList.remove('hidden');
          // Oculta após alguns segundos
          setTimeout(() => {
            msgEl.classList.add('hidden');
          }, 3000);
        }
      }
    });
  }

  // Determina qual inicializador executar com base no conteúdo da página
  document.addEventListener('DOMContentLoaded', () => {
    try {
      if (document.getElementById('registration-form')) {
        // Ignora a promise resultante
        initRegistrationPage();
      }
      if (document.getElementById('lots-container')) {
        initAdminPage();
      }
      if (document.getElementById('checkin-table')) {
        initCheckinPage();
      }
    } catch (err) {
      console.error('Erro durante inicialização:', err);
    }
  });
})();