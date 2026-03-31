// js/movimentacao.js
import { db } from './firebase-config.js';
import { showLoader, formatCurrency, confirmAction } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!db) return;

    const els = {
        selectExtrato: document.getElementById('select-jogador-extrato'),
        extratoList: document.getElementById('extrato-list'),
        extratoTitle: document.getElementById('extrato-title'),
        selectManual: document.getElementById('select-jogador-manual'),
        valorInput: document.getElementById('movimentacao-valor'),
        descInput: document.getElementById('movimentacao-descricao'),
        addMovBtn: document.getElementById('add-mov-manual-button'),
        selectAposta: document.getElementById('select-aposta-premiada'),
        premioInput: document.getElementById('prize-valor-total'),
        distribuirBtn: document.getElementById('distribute-prize-button'),
        participantesDiv: document.getElementById('participantes-aposta')
    };

    let currentObserver = null;
    let apostasPendentes = [];

    // === CARREGAR JOGADORES ===
    function loadJogadores() {
        db.collection('jogadores').where('status', '==', 'ativo').onSnapshot(snap => {
            const players = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            players.sort((a, b) => a.nome.localeCompare(b.nome));

            const currExtrato = els.selectExtrato.value;
            const currManual = els.selectManual.value;

            els.selectExtrato.innerHTML = '<option value="">Selecione um jogador</option>';
            els.selectManual.innerHTML = '<option value="">Selecione um jogador</option>';

            players.forEach(p => {
                const opt = `<option value="${p.id}">${p.nome} (${formatCurrency(p.saldo || 0)})</option>`;
                els.selectExtrato.innerHTML += opt;
                els.selectManual.innerHTML += opt;
            });

            els.selectExtrato.value = players.some(p => p.id === currExtrato) ? currExtrato : '';
            els.selectManual.value = players.some(p => p.id === currManual) ? currManual : '';
        });
    }

    loadJogadores();

    // === EXTRATO ===
    els.selectExtrato.addEventListener('change', () => {
        if (currentObserver) currentObserver();
        const playerId = els.selectExtrato.value;
        if (!playerId) {
            els.extratoList.innerHTML = '<p>Selecione um jogador.</p>';
            els.extratoTitle.textContent = 'Extrato';
            return;
        }

        showLoader(true);
        els.extratoTitle.textContent = `Extrato: ${els.selectExtrato.selectedOptions[0].text.split(' (')[0]}`;

        currentObserver = db.collection('movimentacoes')
            .where('jogadorId', '==', playerId)
            .orderBy('data', 'desc')
            .onSnapshot(snap => {
                const movs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                renderExtrato(movs);
                showLoader(false);
            }, err => {
                console.error(err);
                els.extratoList.innerHTML = '<p style="color:red;">Erro ao carregar extrato.</p>';
                showLoader(false);
            });
    });

    function renderExtrato(movs) {
        els.extratoList.innerHTML = movs.length === 0
            ? '<p>Nenhuma movimentação.</p>'
            : movs.map(m => `
                <div class="history-item">
                    <span>
                        <strong>${m.descricao}</strong>
                        <small>${new Date(m.data.toDate()).toLocaleString('pt-BR')}</small>
                        <br><span class="${m.valor < 0 ? 'negative' : 'saldo'}">${m.valor < 0 ? '-' : '+'}${formatCurrency(Math.abs(m.valor))}</span>
                    </span>
                </div>
            `).join('');
    }

    // === MOVIMENTAÇÃO MANUAL ===
    els.addMovBtn.addEventListener('click', async () => {
        const playerId = els.selectManual.value;
        const valor = parseFloat(els.valorInput.value.replace(',', '.'));
        const desc = els.descInput.value.trim();

        if (!playerId || isNaN(valor) || !desc) return alert('Preencha todos os campos.');

        if (!confirmAction(`Adicionar ${formatCurrency(valor)} para ${els.selectManual.selectedOptions[0].text.split(' (')[0]}?`)) return;

        showLoader(true);
        els.addMovBtn.disabled = true;
        els.addMovBtn.textContent = 'Adicionando...';

        try {
            const batch = db.batch();
            const playerRef = db.collection('jogadores').doc(playerId);
            batch.update(playerRef, { saldo: firebase.firestore.FieldValue.increment(valor) });

            const movRef = db.collection('movimentacoes').doc();
            batch.set(movRef, {
                jogadorId: playerId,
                data: firebase.firestore.FieldValue.serverTimestamp(),
                tipo: valor > 0 ? 'entrada' : 'saida',
                valor: Math.abs(valor),
                descricao: desc,
                refId: null
            });

            await batch.commit();
            alert('Movimentação adicionada!');
            els.valorInput.value = '';
            els.descInput.value = '';
        } catch (err) {
            alert('Erro: ' + err.message);
        } finally {
            showLoader(false);
            els.addMovBtn.disabled = false;
            els.addMovBtn.textContent = 'Adicionar Movimentação';
        }
    });

    // === REGISTRAR PRÊMIO ===
    db.collection('apostas').where('status', '==', 'pendente').orderBy('dataCriacao', 'desc').onSnapshot(snap => {
        apostasPendentes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderApostasPremiadas();
    });

    function renderApostasPremiadas() {
        els.selectAposta.innerHTML = '<option value="">Selecione o bolão que ganhou</option>';
        apostasPendentes.forEach(a => {
            els.selectAposta.innerHTML += `<option value="${a.id}">${a.nomeBolao} (${a.participantesNomes?.join(', ')})</option>`;
        });
    }

    els.selectAposta.addEventListener('change', () => {
        const aposta = apostasPendentes.find(a => a.id === els.selectAposta.value);
        els.participantesDiv.innerHTML = aposta
            ? `<strong>Participantes (${aposta.participantesNomes.length}):</strong> ${aposta.participantesNomes.join(', ')}`
            : '';
    });

    els.distribuirBtn.addEventListener('click', async () => {
        const apostaId = els.selectAposta.value;
        const valorTotal = parseFloat(els.premioInput.value.replace(',', '.'));
        if (!apostaId || isNaN(valorTotal) || valorTotal <= 0) return alert('Selecione bolão e valor válido.');

        const aposta = apostasPendentes.find(a => a.id === apostaId);
        const num = aposta.participantes.length;
        const porJogador = valorTotal / num;

        if (!confirmAction(`Distribuir ${formatCurrency(valorTotal)} (${formatCurrency(porJogador)} por jogador)?`)) return;

        showLoader(true);
        els.distribuirBtn.disabled = true;

        try {
            const batch = db.batch();
            const premioRef = db.collection('premios').doc();
            const ts = firebase.firestore.FieldValue.serverTimestamp();

            batch.set(premioRef, {
                apostaId, data: ts, nomeBolao: aposta.nomeBolao,
                valorTotal, valorPorJogador: porJogador,
                participantes: aposta.participantes,
                participantesNomes: aposta.participantesNomes
            });

            batch.update(db.collection('apostas').doc(apostaId), { status: 'premiada' });

            aposta.participantes.forEach(id => {
                batch.update(db.collection('jogadores').doc(id), {
                    saldo: firebase.firestore.FieldValue.increment(porJogador)
                });
                const movRef = db.collection('movimentacoes').doc();
                batch.set(movRef, {
                    jogadorId: id, data: ts, tipo: 'entrada',
                    valor: porJogador, descricao: `Prêmio: ${aposta.nomeBolao}`, refId: premioRef.id
                });
            });

            await batch.commit();
            alert('Prêmio distribuído!');
            els.premioInput.value = '';
            els.selectAposta.value = '';
            els.participantesDiv.innerHTML = '';
        } catch (err) {
            alert('Erro: ' + err.message);
        } finally {
            showLoader(false);
            els.distribuirBtn.disabled = false;
        }
    });

    window.addEventListener('beforeunload', () => currentObserver && currentObserver());
});