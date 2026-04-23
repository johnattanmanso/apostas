import { db } from './firebase-config.js';
import { collection, query, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const playerListTable = document.querySelector('#player-list-table tbody');
    const loader = document.getElementById('loader');

    if (!playerListTable) return;

    if (loader) loader.classList.add('active');

    const q = query(collection(db, "jogadores"), orderBy("nome", "asc"));

    onSnapshot(q, (snapshot) => {
        playerListTable.innerHTML = '';
        
        if (snapshot.empty) {
            playerListTable.innerHTML = '<tr><td colspan="3">Nenhum jogador cadastrado.</td></tr>';
        } else {
            snapshot.forEach((doc) => {
                const p = doc.data();
                const saldo = p.saldo || 0;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${p.nome}</td>
                    <td class="${saldo < 0 ? 'negative' : 'saldo'}">
                        ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldo)}
                    </td>
                    <td><span class="${saldo < 0 ? 'status-negativo' : 'status-ok'}">
                        ${saldo < 0 ? 'Pendente' : 'OK'}
                    </span></td>
                `;
                playerListTable.appendChild(tr);
            });
        }
        if (loader) loader.classList.remove('active');
    }, (error) => {
        console.error("Erro Firestore:", error);
        alert("Erro ao carregar dados. Verifique as regras do Firebase.");
        if (loader) loader.classList.remove('active');
    });
});
