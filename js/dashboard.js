// js/dashboard.js
import { db } from './firebase-config.js';
import { 
    collection, 
    onSnapshot, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#player-list-table tbody');
    const loader = document.getElementById('loader');

    if (!tableBody) return;

    if (loader) loader.classList.add('active');

    try {
        const q = query(collection(db, "jogadores"), orderBy("nome", "asc"));

        onSnapshot(q, (snapshot) => {
            tableBody.innerHTML = '';
            
            if (snapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="3">Nenhum jogador encontrado.</td></tr>';
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
                    tableBody.appendChild(tr);
                });
            }
            if (loader) loader.classList.remove('active');
        }, (error) => {
            console.error("Erro no Firestore:", error);
            if (loader) loader.classList.remove('active');
        });
    } catch (err) {
        console.error("Erro de inicialização:", err);
    }
});
