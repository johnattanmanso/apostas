// js/nova-aposta.js
import { db } from './firebase-config.js';
import { showLoader, formatCurrency, confirmAction } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
<<<<<<< HEAD
    // Adiciona um timeout para garantir que o 'db' do firebase-config.js foi inicializado
    setTimeout(() => {
        // Verificações Iniciais Robustas
        if (typeof db === 'undefined' || !db || typeof auth === 'undefined' || !auth) {
            console.error('Firestore (db) ou Auth não foi inicializado corretamente em nova-aposta.js.');
            alert('Erro crítico de inicialização. Recarregue a página.');
            return;
        }
    
=======
    if (!db) return alert('Erro: Firestore não inicializado.');
>>>>>>> 4809f1087205abc3b6f866ff30d4e3f0a7c92d2c

    const elements = {
        nomeBolao: document.getElementById('aposta-nome'),
        tipoJogo: document.getElementById('select-tipo-jogo'),
        concurso: document.getElementById('linha-concurso'),
        dataSorteio: document.getElementById('linha-data-sorteio'),
        premioEstimado: document.getElementById('linha-premio-estimado'),
        quantidade: document.getElementById('linha-quantidade'),
        numeros: document.getElementById('linha-numeros'),
        addLinha: document.getElementById('add-linha-aposta-button'),
        linhasList: document.getElementById('linhas-aposta-list'),
        totalSpan: document.getElementById('aposta-total'),
        checklist: document.getElementById('player-checklist'),
        finalizar: document.getElementById('finalizar-aposta-button')
    };

    let tiposDeJogo = [];
    let linhas = [];
    let unsubscribeJogadores = () => {};

    // === CARREGAR TIPOS DE JOGO ===
    db.collection('tiposDeJogo').orderBy('nome').onSnapshot(snap => {
        tiposDeJogo = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        renderTiposJogo();
    });

    function renderTiposJogo() {
        const current = elements.tipoJogo.value;
        elements.tipoJogo.innerHTML = '<option value="">Selecione o tipo de jogo</option>';
        tiposDeJogo.forEach(t => {
            elements.tipoJogo.innerHTML += `<option value="${t.id}">${t.nome} (${formatCurrency(t.valorAtual)})</option>`;
        });
        elements.tipoJogo.value = current;
    }

    // === CARREGAR JOGADORES ATIVOS ===
    function loadJogadores() {
        unsubscribeJogadores();
        unsubscribeJogadores = db.collection('jogadores')
            .where('status', '==', 'ativo')
            .onSnapshot(snap => {
                const players = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderChecklist(players);
            });
    }

    function renderChecklist(players) {
        elements.checklist.innerHTML = players.length === 0
            ? '<p>Nenhum jogador ativo.</p>'
            : players.map(p => `
                <label class="checkbox-label">
                    <input type="checkbox" class="player-checkbox" value="${p.id}" data-nome="${p.nome}">
                    <span>${p.nome} (${formatCurrency(p.saldo || 0)})</span>
                </label>
            `).join('');
    }

    loadJogadores();

    // === ADICIONAR LINHA DE JOGO ===
    elements.addLinha.addEventListener('click', () => {
        const tipoId = elements.tipoJogo.value;
        const quantidade = parseInt(elements.quantidade.value) || 1;
        const dataSorteio = elements.dataSorteio.value;

        if (!tipoId) return alert('Selecione o tipo de jogo.');
        if (quantidade < 1) return alert('Quantidade deve ser maior que zero.');
        if (dataSorteio && new Date(dataSorteio) < new Date().setHours(0,0,0,0)) {
            return alert('Data do sorteio deve ser futura.');
        }

        const tipo = tiposDeJogo.find(t => t.id === tipoId);
        const valorTotal = tipo.valorAtual * quantidade;

        linhas.push({
            tipoJogoId: tipoId,
            tipoJogoNome: tipo.nome,
            valorUnitario: tipo.valorAtual,
            quantidade,
            valorTotal,
            concurso: elements.concurso.value.trim(),
            dataSorteio,
            premioEstimado: parseFloat(elements.premioEstimado.value) || 0,
            numeros: elements.numeros.value.trim()
        });

        renderLinhas();
        limparCamposLinha();
    });

    function renderLinhas() {
        elements.linhasList.innerHTML = linhas.length === 0
            ? '<p>Nenhum jogo adicionado.</p>'
            : linhas.map((l, i) => `
                <div class="history-item">
                    <span>
                        <strong>${l.tipoJogoNome}</strong> × ${l.quantidade}
                        <small>Concurso: ${l.concurso || 'N/D'} | Data: ${l.dataSorteio || 'N/D'}</small>
                        <br>R$ ${formatCurrency(l.valorTotal)}
                    </span>
                    <button class="delete-linha-btn" data-index="${i}">Remover</button>
                </div>
            `).join('');

        const total = linhas.reduce((s, l) => s + l.valorTotal, 0);
        elements.totalSpan.textContent = `Custo Total: ${formatCurrency(total)}`;
    }

    function limparCamposLinha() {
        elements.concurso.value = '';
        elements.dataSorteio.value = '';
        elements.premioEstimado.value = '';
        elements.quantidade.value = '1';
        elements.numeros.value = '';
    }

    elements.linhasList.addEventListener('click', e => {
        if (e.target.classList.contains('delete-linha-btn')) {
            const i = parseInt(e.target.dataset.index);
            linhas.splice(i, 1);
            renderLinhas();
        }
    });

    // === FINALIZAR BOLÃO ===
    elements.finalizar.addEventListener('click', async () => {
        const nome = elements.nomeBolao.value.trim();
        if (!nome) return alert('Informe o nome do bolão.');
        if (linhas.length === 0) return alert('Adicione pelo menos um jogo.');

        const checked = elements.checklist.querySelectorAll('.player-checkbox:checked');
        if (checked.length === 0) return alert('Selecione pelo menos um jogador.');

        const participantes = Array.from(checked).map(c => ({
            id: c.value,
            nome: c.dataset.nome
        }));

        const custoTotal = linhas.reduce((s, l) => s + l.valorTotal, 0);
        const custoPorJogador = custoTotal / participantes.length;

        if (!confirmAction(
            `Nome: ${nome}\n` +
            `Custo Total: ${formatCurrency(custoTotal)}\n` +
            `Participantes: ${participantes.length}\n` +
            `Custo por Jogador: ${formatCurrency(custoPorJogador)}\n\n` +
            `Confirmar rateio?`
        )) return;

        showLoader(true);
        elements.finalizar.disabled = true;
        elements.finalizar.textContent = 'Processando...';

        try {
            const batch = db.batch();
            const apostaRef = db.collection('apostas').doc();
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();

            batch.set(apostaRef, {
                nomeBolao: nome,
                dataCriacao: timestamp,
                custoTotal,
                custoPorJogador,
                participantes: participantes.map(p => p.id),
                participantesNomes: participantes.map(p => p.nome),
                status: 'pendente'
            });

            linhas.forEach(l => {
                const linhaRef = db.collection('linhasDeAposta').doc();
                batch.set(linhaRef, { apostaId: apostaRef.id, ...l });
            });

            participantes.forEach(p => {
                const playerRef = db.collection('jogadores').doc(p.id);
                batch.update(playerRef, {
                    saldo: firebase.firestore.FieldValue.increment(-custoPorJogador)
                });

                const movRef = db.collection('movimentacoes').doc();
                batch.set(movRef, {
                    jogadorId: p.id,
                    data: timestamp,
                    tipo: 'saida',
                    valor: -custoPorJogador,
                    descricao: `Rateio Bolão: ${nome}`,
                    refId: apostaRef.id
                });
            });

            await batch.commit();
            alert(`Bolão "${nome}" criado com sucesso!`);
            resetForm();
        } catch (err) {
            console.error(err);
            alert('Erro ao criar bolão: ' + err.message);
        } finally {
            showLoader(false);
            elements.finalizar.disabled = false;
            elements.finalizar.textContent = 'Finalizar e Ratear Bolão';
        }
    });

    function resetForm() {
        elements.nomeBolao.value = '';
        linhas = [];
        renderLinhas();
        elements.checklist.querySelectorAll('.player-checkbox').forEach(cb => cb.checked = false);
    }

    window.addEventListener('beforeunload', () => unsubscribeJogadores());
});