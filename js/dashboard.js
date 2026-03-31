// js/dashboard.js
import { db, auth } from './firebase-config.js';
import { showLoader, formatCurrency } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!db) return alert('Erro: Firestore não inicializado.');

    const playerListTable = document.getElementById('player-list-table');
    if (!playerListTable) return;

    showLoader(true);
    let unsubscribe = () => {};

    const setupObserver = () => {
        unsubscribe = db.collection('jogadores')
            .where('status', '==', 'ativo')
            .onSnapshot(snapshot => {
                const players = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

                playerListTable.innerHTML = '';
                if (players.length === 0) {
                    playerListTable.innerHTML = '<tr><td colspan="3">Nenhum jogador ativo.</td></tr>';
                    showLoader(false);
                    return;
                }

                players.forEach(p => {
                    const saldo = p.saldo || 0;
                    const status = saldo < 0
                        ? `<span class="status-negativo">PIX Pendente: ${formatCurrency(Math.abs(saldo))}</span>`
                        : '<span class="status-ok">Saldo OK</span>';

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${p.nome || 'Sem Nome'}</td>
                        <td class="${saldo < 0 ? 'negative' : 'saldo'}">${formatCurrency(saldo)}</td>
                        <td>${status}</td>
                    `;
                    playerListTable.appendChild(tr);
                });
                showLoader(false);
            }, err => {
                console.error(err);
                playerListTable.innerHTML = `<tr><td colspan="3" style="color:red;">Erro ao carregar.</td></tr>`;
                showLoader(false);
            });
    };

    setupObserver();

    window.addEventListener('beforeunload', () => unsubscribe());
});