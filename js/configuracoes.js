// js/configuracoes.js
document.addEventListener('DOMContentLoaded', () => {
     // Adiciona timeout
    setTimeout(() => {
        if (typeof db === 'undefined' || !db) {
             console.error('Firestore (db) não foi inicializado corretamente em configuracoes.js.');
             alert("Erro crítico: Conexão com banco de dados falhou. Recarregue a página.");
             return;
        }

        // Coleções
        const gameTypeCollection = db.collection('tiposDeJogo');
        const priceHistoryCollection = db.collection('historicoPrecos');
        const playersCollection = db.collection('jogadores');

        // Elementos DOM (com validação)
        const newPlayerNameInput = document.getElementById('new-player-name');
        const addPlayerButton = document.getElementById('add-player-button');
        const activePlayerListTbody = document.getElementById('active-player-list-tbody'); // MUDANÇA: ID do tbody
        const gameNameInput = document.getElementById('new-game-name');
        const gameValueInput = document.getElementById('new-game-value');
        const addGameButton = document.getElementById('add-game-type-button');
        const gameTypeList = document.getElementById('game-type-list');
        const inactivePlayerList = document.getElementById('inactive-player-list');

        // Verifica se todos os elementos principais existem
        if (!newPlayerNameInput || !addPlayerButton || !activePlayerListTbody || !gameNameInput || !gameValueInput || !addGameButton || !gameTypeList || !inactivePlayerList) {
            console.error("Erro Fatal: Elementos essenciais da página 'Configurações' não encontrados no HTML!");
            alert("Erro ao carregar a página de Configurações. Elementos faltando.");
            return;
        }


        // --- LÓGICA DE ADICIONAR JOGADOR ---
        addPlayerButton.addEventListener('click', () => {
            const playerName = newPlayerNameInput.value.trim();
            if (playerName) {
                addPlayerButton.disabled = true; addPlayerButton.textContent = 'Adicionando...';
                playersCollection.add({
                    nome: playerName,
                    saldo: 0,
                    status: 'ativo'
                }).then(() => {
                    newPlayerNameInput.value = '';
                    alert('Jogador "' + playerName + '" adicionado!');
                }).catch(e => {
                    console.error('Erro ao adicionar jogador: ', e);
                    alert(`Erro: ${e.message}`);
                }).finally(() => {
                     addPlayerButton.disabled = false; addPlayerButton.textContent = 'Adicionar Jogador';
                });
            } else {
                alert('Por favor, digite o nome do jogador.');
            }
        });

        // --- LÓGICA DE GERENCIAR JOGADORES ATIVOS (RENDERIZAÇÃO EM TABELA) ---
        const renderActivePlayers = (players) => {
            activePlayerListTbody.innerHTML = ''; // Limpa o tbody
            if (!players || players.length === 0) {
                 activePlayerListTbody.innerHTML = '<tr><td colspan="3">Nenhum jogador ativo.</td></tr>';
                 return;
            }

            players.forEach(player => {
                const tr = document.createElement('tr'); // Cria uma linha
                tr.setAttribute('data-id', player.id);
                const saldo = (typeof player.saldo === 'number') ? player.saldo : 0;
                const saldoClass = saldo < 0 ? 'negative' : '';
                const nome = player.nome || 'Sem Nome';

                // Célula 1: Nome (com span para edição)
                const tdName = document.createElement('td');
                tdName.innerHTML = `<span class="player-name">${nome}</span>`;

                // Célula 2: Saldo
                const tdSaldo = document.createElement('td');
                tdSaldo.className = `saldo ${saldoClass}`;
                tdSaldo.textContent = `R$ ${saldo.toFixed(2)}`;

                // Célula 3: Ações (com classe para alinhamento)
                const tdActions = document.createElement('td');
                tdActions.classList.add('player-item-actions');
                tdActions.innerHTML = `
                    <button class="edit-btn" data-id="${player.id}">Editar Nome</button>
                    <button class="inactivate-btn" data-id="${player.id}">Inativar</button>
                `;

                tr.appendChild(tdName);
                tr.appendChild(tdSaldo);
                tr.appendChild(tdActions);
                activePlayerListTbody.appendChild(tr); // Adiciona a linha ao tbody
            });
        };

        // Observador para jogadores ativos
        playersCollection
            .where('status', '==', 'ativo')
            .onSnapshot(snapshot => {
                const players = snapshot.docs.map(doc => ({
                     id: doc.id,
                     nome: doc.data()?.nome,
                     saldo: doc.data()?.saldo,
                     status: 'ativo'
                 }));
                players.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
                renderActivePlayers(players);
            }, error => {
                console.error("Erro ao buscar jogadores ativos (Config): ", error);
                activePlayerListTbody.innerHTML = `<tr><td colspan="3" style="color:red;">Erro ao carregar (${error.code || ''}).</td></tr>`;
            });

        // Lógica de Editar e Inativar (adaptada para tabela)
        activePlayerListTbody.addEventListener('click', async (e) => {
            if (!e.target || !e.target.dataset?.id) return;
            const id = e.target.dataset.id;
            const playerItem = e.target.closest('tr'); // Agora busca o 'tr'
            if (!playerItem) return;
            const button = e.target;

            if (button.classList.contains('inactivate-btn')) {
                if (confirm('Tem certeza que deseja inativar este jogador?')) {
                    button.disabled = true;
                    try {
                        await playersCollection.doc(id).update({ status: 'inativo' });
                         console.log('Jogador inativado.');
                    } catch (err) {
                        console.error('Erro ao inativar: ', err);
                        alert(`Erro ao inativar: ${err.message}`);
                        button.disabled = false;
                    }
                }
            }

            if (button.classList.contains('edit-btn')) {
                const nameCell = playerItem.querySelector('td:first-child'); // Pega a primeira célula
                const nameSpan = nameCell.querySelector('.player-name');
                const currentName = nameSpan?.textContent || '';
                if (!nameSpan || playerItem.querySelector('.edit-nome-input')) return; // Já está em modo edição

                // Substitui o conteúdo da CÉLULA pelo input
                nameCell.innerHTML = `<input type="text" class="edit-nome-input" value="${currentName}">`;
                const input = nameCell.querySelector('input'); // Pega o input recém-criado
                input.focus();
                input.select(); // Seleciona o texto

                // Salva o nome original no botão para poder reverter
                button.dataset.originalName = currentName; 
                button.textContent = 'Salvar'; 
                button.classList.remove('edit-btn'); 
                button.classList.add('save-btn');
            }

            else if (button.classList.contains('save-btn')) {
                const input = playerItem.querySelector('.edit-nome-input');
                const newName = input?.value.trim();
                const originalName = button.dataset.originalName || 'Nome'; // Pega o nome original salvo

                 const revertEdit = () => {
                    const nameCell = playerItem.querySelector('td:first-child');
                    if (nameCell) nameCell.innerHTML = `<span class="player-name">${originalName}</span>`; // Restaura o span com nome original
                    button.textContent = 'Editar Nome'; 
                    button.classList.remove('save-btn'); 
                    button.classList.add('edit-btn');
                    button.disabled = false;
                    delete button.dataset.originalName;
                 };

                if (newName) {
                    button.disabled = true; button.textContent = 'Salvando...';
                    try {
                        await playersCollection.doc(id).update({ nome: newName });
                        console.log("Nome atualizado para", newName);
                        // O listener onSnapshot vai redesenhar, não precisa reverter
                    } catch (err) {
                         console.error('Erro ao salvar nome: ', err);
                         alert(`Erro ao salvar: ${err.message}`);
                         revertEdit(); // Reverte em caso de erro
                    }
                } else {
                    alert("O nome não pode ficar vazio.");
                    revertEdit(); // Reverte se o nome for vazio
                }
            }
        });


        // --- LÓGICA DE TIPOS DE JOGO ---
        addGameButton.addEventListener('click', () => {
            const nome = gameNameInput.value.trim();
            const valor = parseFloat(gameValueInput.value.replace(',', '.'));

            if (nome && !isNaN(valor) && valor > 0) {
                 addGameButton.disabled = true; addGameButton.textContent = 'Adicionando...';
                gameTypeCollection.add({
                    nome: nome,
                    valorAtual: valor
                }).then((docRef) => {
                    priceHistoryCollection.add({
                        tipoJogoId: docRef.id,
                        nome: nome,
                        valor: valor,
                        dataMudanca: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    gameNameInput.value = '';
                    gameValueInput.value = '';
                    alert('Tipo de jogo adicionado!');
                }).catch(e => {
                    console.error('Erro ao adicionar tipo de jogo: ', e);
                     alert(`Erro: ${e.message}`);
                }).finally(() => {
                    addGameButton.disabled = false; addGameButton.textContent = 'Adicionar Tipo de Jogo';
                });
            } else {
                alert('Por favor, preencha o nome e um valor válido (maior que zero).');
            }
        });

        const renderGameTypes = (games) => {
            gameTypeList.innerHTML = '';
            if (!games || games.length === 0) {
                gameTypeList.innerHTML = '<p>Nenhum tipo de jogo cadastrado.</p>';
                return;
            }
            games.forEach(game => {
                 const valorAtualNum = game.valorAtual;
                 const valorAtual = (typeof valorAtualNum === 'number') ? valorAtualNum.toFixed(2) : 'Inválido';
                 const nome = game.nome || 'Sem Nome';
                const item = document.createElement('div');
                item.classList.add('history-item');
                item.innerHTML = `
                    <span>${nome} - <strong>R$ ${valorAtual}</strong></span>
                    <button class="edit-price-btn" data-id="${game.id}" data-nome="${nome}" data-valor="${valorAtualNum || 0}">Atualizar Valor</button>
                `;
                gameTypeList.appendChild(item);
            });
        };

        gameTypeCollection.orderBy('nome').onSnapshot(snapshot => {
            const games = snapshot.docs.map(doc => ({
                id: doc.id,
                nome: doc.data()?.nome,
                valorAtual: doc.data()?.valorAtual
            }));
            renderGameTypes(games);
        }, error => {
             console.error("Erro ao buscar tipos de jogo (Config): ", error);
             gameTypeList.innerHTML = `<p style="color:red;">Erro (${error.code || ''}).</p>`;
        });

        gameTypeList.addEventListener('click', async (e) => {
            if (!e.target || !e.target.classList.contains('edit-price-btn')) return;
            const id = e.target.dataset.id;
            const nome = e.target.dataset.nome;
            const valorAntigo = parseFloat(e.target.dataset.valor);
            const novoValorStr = prompt(`Qual o NOVO valor para "${nome}"?`, (!isNaN(valorAntigo) ? valorAntigo.toFixed(2) : ''));
            if (novoValorStr === null) return;

            const novoValor = parseFloat(novoValorStr.replace(',', '.'));
            const button = e.target;

            if (!isNaN(novoValor) && novoValor > 0 && novoValor !== valorAntigo) {
                button.disabled = true;
                try {
                    await gameTypeCollection.doc(id).update({ valorAtual: novoValor });
                    await priceHistoryCollection.add({
                        tipoJogoId: id,
                        nome: nome,
                        valor: novoValor,
                        dataMudanca: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    alert('Valor atualizado!');
                } catch (err) {
                     console.error('Erro ao atualizar valor: ', err);
                     alert(`Erro: ${err.message}`);
                     button.disabled = false;
                }
            } else if (novoValor === valorAntigo){
                console.log("Valor não alterado.");
            } else {
                alert('Valor inválido. Insira um número maior que zero.');
            }
        });

        // --- LÓGICA DE JOGADORES INATIVOS ---
        const renderInactivePlayers = (players) => {
            inactivePlayerList.innerHTML = '';
            if (!players || players.length === 0) {
                inactivePlayerList.innerHTML = '<p>Nenhum jogador inativo.</p>';
                return;
            }
            players.forEach(player => {
                const item = document.createElement('div');
                item.classList.add('player-item');
                item.innerHTML = `
                    <span class="player-name">${player.nome || 'Sem Nome'}</span>
                    <div class="player-item-actions">
                        <button class="reactivate-btn" data-id="${player.id}">Reativar</button>
                    </div>
                `;
                inactivePlayerList.appendChild(item);
            });
        };

        playersCollection.where('status', '==', 'inativo').onSnapshot(snapshot => {
            const players = snapshot.docs.map(doc => ({
                id: doc.id,
                nome: doc.data()?.nome
            }));
            players.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
            renderInactivePlayers(players);
        }, error => {
             console.error("Erro ao buscar jogadores inativos (Config): ", error);
             inactivePlayerList.innerHTML = `<p style="color:red;">Erro (${error.code || ''}).</p>`;
        });

        inactivePlayerList.addEventListener('click', (e) => {
            if (!e.target || !e.target.classList.contains('reactivate-btn')) return;
            const id = e.target.dataset.id;
            const button = e.target;
            if (confirm('Reativar este jogador?')) {
                button.disabled = true;
                playersCollection.doc(id).update({
                    status: 'ativo'
                }).catch(err => {
                    console.error('Erro ao reativar: ', err);
                    alert(`Erro: ${err.message}`);
                    button.disabled = false;
                });
            }
        });
    }, 200); // Fim do setTimeout
});