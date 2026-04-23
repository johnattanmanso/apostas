// js/dashboard.js
import { db } from './firebase-config.js';
import { 
    collection, 
    query, 
    where, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const playerListTable = document.querySelector('#player-list-table tbody');
    const loader = document.getElementById('loader');

    if (!playerListTable) return;

    // Função para mostrar/esconder o loader
    const showLoader = (show) => {
        if (loader) {
            show ? loader.classList.add('active') : loader.classList.remove('active');
        }
    };

    // Função para formatar moeda
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    showLoader(true);

    // Configurando a consulta (Query) ao Firestore
    const q = query(
        collection(db, "jogadores"), 
        where("status", "==", "ativo")
    );

    // Escutando os dados em tempo real (onSnapshot)
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const players = [];
        snapshot.forEach((doc) => {
            players.push({ id: doc.id, ...doc.data() });
        });

        // Ordenar por nome
        players.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

        // Limpar tabela
        playerListTable.innerHTML = '';

        if (players.length === 0) {
            playerListTable.innerHTML = '<tr><td colspan="3">Nenhum jogador ativo.</td></tr>';
            showLoader(false);
            return;
        }

        // Preencher tabela
        players.forEach(p => {
            const saldo = p.saldo || 0;
            const statusClass = saldo < 0 ? 'status-negativo' : 'status-ok';
            const statusText = saldo < 0 ? `PIX Pendente` : 'Saldo OK';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.nome || 'Sem Nome'}</td>
                <td class="${saldo < 0 ? 'negative' : 'saldo'}">${formatCurrency(saldo)}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
            `;
            playerListTable.appendChild(tr);
        });

        showLoader(false);
    }, (error) => {
        console.error("Erro ao carregar jogadores:", error);
        playerListTable.innerHTML = '<tr><td colspan="3" style="color:red;">Erro ao carregar dados.</td></tr>';
        showLoader(false);
    });

    // Limpar o listener quando sair da página
    window.addEventListener('beforeunload', () => unsubscribe());
});
