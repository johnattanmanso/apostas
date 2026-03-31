// js/historico.js
document.addEventListener('DOMContentLoaded', () => {
    // Adiciona timeout
    setTimeout(() => {
        if (typeof db === 'undefined' || !db) {
             console.error('Firestore (db) não foi inicializado corretamente em historico.js.');
             alert("Erro crítico: Conexão com banco de dados falhou. Recarregue a página.");
             return;
        }

        // Coleções
        const apostasCollection = db.collection('apostas');
        const premiosCollection = db.collection('premios');
        const playersCollection = db.collection('jogadores');
        const movimentacoesCollection = db.collection('movimentacoes');
        const linhasApostaCollection = db.collection('linhasDeAposta');

        // Elementos DOM (com validação)
        const apostasHistoryList = document.getElementById('apostas-history-list');
        const prizeHistoryList = document.getElementById('prize-history-list');

        if (!apostasHistoryList || !prizeHistoryList) {
            console.error("Erro Fatal: Listas de histórico não encontradas no HTML!");
            alert("Erro ao carregar a página de Histórico.");
            return;
        }


        // --- FUNÇÕES DE RENDERIZAÇÃO ---
        const renderApostas = (apostas) => {
            apostasHistoryList.innerHTML = '';
            if(!apostas || apostas.length === 0) {
                apostasHistoryList.innerHTML = '<p>Nenhum bolão no histórico.</p>';
                return;
            }
            apostas.forEach(aposta => {
                const item = document.createElement('div');
                item.classList.add('history-item');
                const data = aposta.dataCriacao?.toDate ? aposta.dataCriacao.toDate().toLocaleDateString('pt-BR') : 'Data Indisp.';
                const status = aposta.status || 'N/A';
                const custoTotal = (typeof aposta.custoTotal === 'number') ? aposta.custoTotal.toFixed(2) : '0.00';
                const custoPorJogador = (typeof aposta.custoPorJogador === 'number') ? aposta.custoPorJogador.toFixed(2) : '0.00';
                const numParticipantes = Array.isArray(aposta.participantes) ? aposta.participantes.length : 0;
                const nomesParticipantes = Array.isArray(aposta.participantesNomes) ? aposta.participantesNomes.join(', ') : 'N/A';
                const nomeBolao = aposta.nomeBolao || 'Bolão Sem Nome';

                item.innerHTML = `
                    <span>
                        <strong>${nomeBolao}</strong> (Criado em: ${data}) - <strong>Status: ${status}</strong>
                        <br>Custo Total: R$ ${custoTotal} (R$ ${custoPorJogador} p/ ${numParticipantes} jogadores)
                        <small>Participantes: ${nomesParticipantes}</small>
                    </span>
                    <button class="delete-aposta-btn" data-id="${aposta.id}">Estornar</button>
                `;
                apostasHistoryList.appendChild(item);
            });
        };

        const renderPremios = (premios) => {
            prizeHistoryList.innerHTML = '';
            if(!premios || premios.length === 0) {
                 prizeHistoryList.innerHTML = '<p>Nenhum prêmio no histórico.</p>';
                 return;
            }
            premios.forEach(premio => {
                const item = document.createElement('div');
                item.classList.add('history-item');
                const data = premio.data?.toDate ? premio.data.toDate().toLocaleDateString('pt-BR') : 'Data Indisp.';
                const valorTotal = (typeof premio.valorTotal === 'number') ? premio.valorTotal.toFixed(2) : '0.00';
                const valorPorJogador = (typeof premio.valorPorJogador === 'number') ? premio.valorPorJogador.toFixed(2) : '0.00';
                const numParticipantes = Array.isArray(premio.participantes) ? premio.participantes.length : 0;
                 const nomesGanhadores = Array.isArray(premio.participantesNomes) ? premio.participantesNomes.join(', ') : 'N/A';
                const nomeBolao = premio.nomeBolao || 'Prêmio Avulso (?)';


                item.innerHTML = `
                    <span>
                        <strong>${nomeBolao}</strong> (Recebido em: ${data})
                        <br>Valor Total: R$ ${valorTotal} (R$ ${valorPorJogador} p/ ${numParticipantes} jogadores)
                        <small>Ganhadores: ${nomesGanhadores}</small>
                    </span>
                    <button class="delete-premio-btn" data-id="${premio.id}">Estornar</button>
                `;
                prizeHistoryList.appendChild(item);
            });
        };

        // --- OBSERVADORES DOS HISTÓRICOS ---
        // Este índice é o que você precisa criar para o "Registrar Prêmio" funcionar
        apostasCollection.orderBy('dataCriacao', 'desc').onSnapshot(snapshot => {
            const apostas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderApostas(apostas);
        }, e => {
            console.error("Erro ao buscar histórico de apostas:", e);
            apostasHistoryList.innerHTML = `<p style="color:red">Erro ao carregar histórico (${e.code || ''}).</p>`;
        });

        // Este índice (premios por data) também é recomendado
        premiosCollection.orderBy('data', 'desc').onSnapshot(snapshot => {
            const premios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderPremios(premios);
        }, e => {
            console.error("Erro ao buscar histórico de prêmios:", e);
            prizeHistoryList.innerHTML = `<p style="color:red">Erro ao carregar histórico (${e.code || ''}).</p>`;
        });


        // --- LÓGICA PARA ESTORNAR (APAGAR) ---
        apostasHistoryList.addEventListener('click', async (e) => {
            if (!e.target || !e.target.classList.contains('delete-aposta-btn')) return;
            if (!confirm('Tem certeza? Isso irá DEVOLVER o valor do bolão para os participantes e apagar o registro.')) return;
            const apostaId = e.target.dataset.id;
            const apostaRef = apostasCollection.doc(apostaId);
            const button = e.target;
            button.disabled = true; button.textContent = 'Estornando...';

            try {
                const apostaDoc = await apostaRef.get();
                if (!apostaDoc.exists) {
                    alert('Bolão não encontrado.');
                    button.disabled = false; button.textContent = 'Estornar';
                    return;
                }
                const { custoPorJogador, participantes, status } = apostaDoc.data();
                if (!Array.isArray(participantes) || participantes.length === 0 || typeof custoPorJogador !== 'number') {
                     alert('Erro: Bolão com dados inválidos para estorno (participantes ou custo).');
                     button.disabled = false; button.textContent = 'Estornar';
                     return;
                }
                if (status === 'premiada'){
                    alert('Não é possível estornar um bolão que já foi premiado. Estorne o prêmio primeiro.');
                    button.disabled = false; button.textContent = 'Estornar';
                    return;
                }

                const batch = db.batch();
                participantes.forEach(playerId => {
                    if(typeof playerId === 'string' && playerId.length > 0) {
                        batch.update(playersCollection.doc(playerId), {
                            saldo: firebase.firestore.FieldValue.increment(custoPorJogador)
                        });
                    } else { console.warn(`ID inválido no bolão ${apostaId}: `, playerId); }
                });
                batch.delete(apostaRef);
                const movs = await movimentacoesCollection.where('refId', '==', apostaId).where('tipo', '==', 'saida').get();
                movs.forEach(doc => batch.delete(doc.ref));
                const linhas = await linhasApostaCollection.where('apostaId', '==', apostaId).get();
                linhas.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
                alert('Bolão estornado e valores devolvidos.');

            } catch (error) {
                console.error('Erro ao estornar aposta: ', error);
                alert(`Erro ao estornar bolão: ${error.message}`);
                button.disabled = false; button.textContent = 'Estornar';
            }
        });

        prizeHistoryList.addEventListener('click', async (e) => {
            if (!e.target || !e.target.classList.contains('delete-premio-btn')) return;
            if (!confirm('Tem certeza? Isso irá RETIRAR o valor do prêmio dos ganhadores, apagar o registro e reverter o status do bolão.')) return;
            const premioId = e.target.dataset.id;
            const premioRef = premiosCollection.doc(premioId);
            const button = e.target;
            button.disabled = true; button.textContent = 'Estornando...';

            try {
                const premioDoc = await premioRef.get();
                if (!premioDoc.exists) {
                     alert('Registro de prêmio não encontrado.');
                     button.disabled = false; button.textContent = 'Estornar';
                     return;
                }
                const { valorPorJogador, participantes, apostaId } = premioDoc.data();
                 if (!Array.isArray(participantes) || participantes.length === 0 || typeof valorPorJogador !== 'number') {
                     alert('Erro: Prêmio com dados inválidos para estorno (participantes ou valor).');
                     button.disabled = false; button.textContent = 'Estornar';
                     return;
                 }
                const batch = db.batch();
                participantes.forEach(playerId => {
                     if(typeof playerId === 'string' && playerId.length > 0) {
                        batch.update(playersCollection.doc(playerId), {
                            saldo: firebase.firestore.FieldValue.increment(-valorPorJogador) // Negativo
                        });
                     } else { console.warn(`ID inválido no prêmio ${premioId}: `, playerId); }
                });
                batch.delete(premioRef);
                const movs = await movimentacoesCollection.where('refId', '==', premioId).where('tipo', '==', 'entrada').get();
                movs.forEach(doc => batch.delete(doc.ref));
                if(apostaId && typeof apostaId === 'string' && apostaId.length > 0) {
                    const apostaRef = apostasCollection.doc(apostaId);
                    const apostaExists = (await apostaRef.get()).exists;
                    if(apostaExists) batch.update(apostaRef, { status: 'pendente' }); // Volta status
                    else console.warn(`Bolão (${apostaId}) do prêmio ${premioId} não encontrado.`);
                }
                await batch.commit();
                alert('Prêmio estornado e valores retirados.');

            } catch (error) {
                console.error('Erro ao estornar prêmio: ', error);
                 alert(`Erro ao estornar prêmio: ${error.message}`);
                 button.disabled = false; button.textContent = 'Estornar';
            }
        });
    }, 200); // Fim do setTimeout
});