// js/dashboard.js
import { db } from './firebase-config.js';
import { 
    collection, 
    onSnapshot, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const playerListTable = document.querySelector('#player-list-table tbody');
    const totalSaldoElement = document.getElementById('total-saldo'); // Caso você tenha esse ID
    const loader = document.getElementById('loader');

    // Função para gerenciar o Loader
    const toggleLoader = (show) => {
        if (loader) {
            show ? loader.classList.add('active') : loader.classList.remove('active');
        }
    };

    if (!playerListTable) return;

    toggleLoader(true);

    try {
        // Criando a consulta: Coleção "jogadores" ordenada por nome
        const q = query(collection(db, "jogadores"), orderBy("nome", "asc"));

        // Escuta em tempo real
        onSnapshot(q, (snapshot) => {
            playerListTable.innerHTML = ''; // Limpa a tabela
            let totalGeral = 0;

            if (snapshot.empty) {
                playerListTable.innerHTML = '<tr><td colspan="3">Nenhum jogador encontrado.</td></tr>';
                toggleLoader(false);
                return;
            }

            snapshot.forEach((doc) => {
                const data = doc.data();
                const saldo = data.saldo || 0;
                totalGeral += saldo;

                const tr = document.createElement('tr');
                
                // Lógica de cores para o saldo
                const saldoClass = saldo < 0 ? 'negative' : 'saldo';
                const statusClass = saldo < 0 ? 'status-negativo' : 'status-ok';
                const statusText = saldo < 0 ? 'PIX Pendente' : 'Saldo OK';

                tr.innerHTML = `
                    <td>${data.nome || 'Sem nome'}</td>
                    <td class="${saldoClass}">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldo)}</td>
                    <td><span class="${statusClass}">${statusText}</span></td>
                `;
                playerListTable.appendChild(tr);
            });

            // Atualiza o total no dashboard se o elemento existir
            if (totalSaldoElement) {
                totalSaldoElement.textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGeral);
            }

            toggleLoader(false);
        }, (error) => {
            // Se cair aqui, o erro é permissão no Firebase ou internet
            console.error("Erro no Snapshot:", error);
            alert("Erro ao ler dados: Verifique as Regras de Segurança do Firebase.");
            toggleLoader(false);
        });

    } catch (err) {
        console.error("Erro ao inicializar consulta:", err);
        alert("Erro crítico de conexão. Verifique o console.");
        toggleLoader(false);
    }
});
