// frontend/js/dashboard.js
const API_URL = "http://localhost:3000/api/cameras";
let cameras = [];
let filtroStatusAtual = "Todos";
let chartInstance = null;

// ==========================================
// INICIALIZAÇÃO E SEGURANÇA
// ==========================================
// Modifique o bloco inicial do seu dashboard.js para ficar assim:
document.addEventListener("DOMContentLoaded", () => {
    // Verifica se o usuário passou pela tela de login
    if (localStorage.getItem('isLogged') !== 'true') {
        window.location.href = 'index.html';
        return;
    }
    
    // Carrega os dados iniciais do servidor
    carregarCamerasDoServidor();

    // Roda a primeira verificação automática logo após carregar a página
    setTimeout(executarPingAutomatico, 2000); // Aguarda 2 segundos para dar tempo do servidor responder à primeira carga
});

// BUSCAR DADOS DO BACKEND (API Node.js)
async function carregarCamerasDoServidor() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Erro na requisição");

        cameras = await response.json();
        renderizarDashboard();
    } catch (error) {
        console.error("Erro ao buscar câmeras do servidor:", error);
        alert("⚠️ Não foi possível conectar ao servidor backend. Certifique-se de que o 'node server.js' está rodando.");
    }
}

// VALIDAÇÃO DE IP: Garante o formato correto de IPv4 (0.0.0.0 a 255.255.255.255)
function validarIPv4(ip) {
    const regexIPv4 = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return regexIPv4.test(ip);
}

// ==========================================
// RENDERIZAÇÃO DA TABELA
// ==========================================
function renderizarDashboard() {
    const tableBody = document.getElementById("cameraTableBody");
    const busca = document.getElementById("searchBar").value.toLowerCase();

    tableBody.innerHTML = "";

    // Filtra as câmeras por Status e por Nome/IP ao mesmo tempo
    const camerasFiltradas = cameras.filter(cam => {
        const correspondeStatus = (filtroStatusAtual === "Todos" || cam.status === filtroStatusAtual);
        const correspondeBusca = cam.nome.toLowerCase().includes(busca) || cam.ip.includes(busca);
        return correspondeStatus && correspondeBusca;
    });


    if (camerasFiltradas.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-slate-500">Nenhuma câmera encontrada.</td></tr>`;
    } else {
        camerasFiltradas.forEach(cam => {
            let statusBadge = "";
            if (cam.status === "Ativa") {
                statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400">● Ativa</span>`;
            } else if (cam.status === "Inativa") {
                statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400">● Inativa</span>`;
            } else {
                statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">● Manutenção</span>`;
            }

            tableBody.innerHTML += `
                <tr class="hover:bg-slate-700/30 transition-colors">
                    <td class="px-6 py-4 font-medium text-white">${cam.nome}</td>
                    <td class="px-6 py-4 text-slate-400 font-mono text-xs">${cam.ip}</td>
                    <td class="px-6 py-4">${statusBadge}</td>
                    <td class="px-6 py-4 text-right space-x-2">
                        <button onclick="testarConexao('${cam.ip}', this)" class="text-emerald-400 hover:text-emerald-300 font-medium text-xs bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded transition-colors">Testar</button>
                        <button onclick="prepararEdicao(${cam.id})" class="text-indigo-400 hover:text-indigo-300 font-medium text-xs bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded transition-colors">Editar</button>
                        <button onclick="deletarCamera(${cam.id})" class="text-red-400 hover:text-red-300 font-medium text-xs bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded transition-colors">Excluir</button>
                    </td>
                </tr>
            `;
        });
    }

    atualizarGrafico();
}

// ==========================================
// LÓGICA DO GRÁFICO (Chart.js) E CONTADORES
// ==========================================
function atualizarGrafico() {
    const total = cameras.length;
    const ativas = cameras.filter(c => c.status === "Ativa").length;
    const inativas = cameras.filter(c => c.status === "Inativa").length;
    const manutencao = cameras.filter(c => c.status === "Manutenção").length;

    // INJEÇÃO DOS CONTADORES EM NÚMEROS NO HTML
    document.getElementById('numTotal').innerText = total;
    document.getElementById('numAtivas').innerText = ativas;
    document.getElementById('numInativas').innerText = inativas;
    document.getElementById('numManutencao').innerText = manutencao;

    const ctx = document.getElementById('statusChart').getContext('2d');

    // Destrói o gráfico anterior para não sobrepor dados ao recriar
    if (chartInstance) {
        chartInstance.destroy();
    }

    if (total === 0) return;

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Ativas', 'Inativas', 'Manutenção'],
            datasets: [{
                data: [ativas, inativas, manutencao],
                backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#94A3B8', font: { size: 11 } }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let valor = context.raw || 0;
                            let porcentagem = ((valor / total) * 100).toFixed(1);
                            return ` ${context.label}: ${valor} (${porcentagem}%)`;
                        }
                    }
                }
            },
            maintainAspectRatio: false,
            cutout: '70%' // Efeito de rosca/donut
        }
    });
}

// ==========================================
// CONTROLADORES DE FILTRO E BUSCA
// ==========================================
function definirFiltroStatus(status) {
    filtroStatusAtual = status;

    // Altera visualmente qual botão está selecionado no topo
    ['Todos', 'Ativa', 'Inativa', 'Manutenção'].forEach(s => {
        const btn = document.getElementById(`btn-filtro-${s}`);
        if (s === status) {
            btn.className = "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors bg-indigo-600 text-white";
        } else {
            btn.className = "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors bg-slate-700 hover:bg-slate-600 text-slate-300";
        }
    });
    renderizarDashboard();
}

function filtrarCameras() {
    renderizarDashboard();
}

// ==========================================
// CONTROLE DO MODAL (FORMULÁRIO)
// ==========================================
function abrirModal() {
    document.getElementById("modalTitle").innerText = "Adicionar Câmera";
    document.getElementById("cameraForm").reset();
    document.getElementById("cameraId").value = "";
    document.getElementById("cameraModal").classList.remove("hidden");
}

function fecharModal() {
    document.getElementById("cameraModal").classList.add("hidden");
}

// ==========================================
// OPERAÇÕES DO CRUD (SALVAR / DELETAR)
// ==========================================
async function salvarCamera(event) {
    event.preventDefault();

    const id = document.getElementById("cameraId").value;
    const nome = document.getElementById("cameraNome").value.trim();
    const ip = document.getElementById("cameraIP").value.trim();
    const status = document.getElementById("cameraStatus").value;

    // Validação de Segurança
    if (!validarIPv4(ip)) {
        alert("⚠️ Endereço IP inválido! Insira um formato correto (Ex: 192.168.1.50).");
        return;
    }

    const dadosCamera = { nome, ip, status };

    try {
        if (id) {
            // ATUALIZAR (PUT)
            await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosCamera)
            });
        } else {
            // CADASTRAR (POST)
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosCamera)
            });
        }
        fecharModal();
        carregarCamerasDoServidor(); // Recarrega os dados atualizados vindo da API
    } catch (error) {
        console.error("Erro ao salvar câmera:", error);
        alert("Erro ao salvar os dados no servidor.");
    }
}

// Preenche os campos do formulário para edição
function prepararEdicao(id) {
    const camera = cameras.find(c => c.id === id);
    if (!camera) return;

    document.getElementById("modalTitle").innerText = "Editar Câmera";
    document.getElementById("cameraId").value = camera.id;
    document.getElementById("cameraNome").value = camera.nome;
    document.getElementById("cameraIP").value = camera.ip;
    document.getElementById("cameraStatus").value = camera.status;

    document.getElementById("cameraModal").classList.remove("hidden");
}

// DELETAR (DELETE)
async function deletarCamera(id) {
    if (confirm("Tem certeza que deseja excluir esta câmera?")) {
        try {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            carregarCamerasDoServidor();
        } catch (error) {
            console.error("Erro ao deletar câmera:", error);
            alert("Erro ao tentar excluir a câmera.");
        }
    }
}

// ==========================================
// LOGOUT
// ==========================================
function logout() {
    localStorage.removeItem('isLogged');
    window.location.href = 'index.html';
}

async function testarConexao(ip, botao) {
    const textoOriginal = botao.innerText;
    botao.innerText = "⚡ Testando...";
    botao.disabled = true;

    try {
        // 1. Faz a chamada para a rota de ping do backend
        const responsePing = await fetch(`http://localhost:3000/api/cameras/ping/${ip}`);
        const resultadoPing = await responsePing.json();

        // 2. Encontra a câmera correspondente na nossa lista local para pegar o ID e o Nome
        const cameraOriginal = cameras.find(c => c.ip === ip);

        if (!cameraOriginal) {
            alert("⚠️ Câmera não encontrada na lista local.");
            return;
        }

        // 3. Define o novo status com base no resultado do ping
        const novoStatus = resultadoPing.online ? "Ativa" : "Inativa";

        // Se o status já for o mesmo, avisa o usuário e não gasta requisição à toa
        if (cameraOriginal.status === novoStatus) {
            if (resultadoPing.online) {
                alert(`✅ A câmera (${ip}) respondeu ao ping e já consta como "Ativa".`);
            } else {
                alert(`❌ A câmera (${ip}) não respondeu ao ping e já consta como "Inativa".`);
            }
            return;
        }

        // 4. Monta o objeto atualizado mantendo o Nome e o IP originais
        const dadosAtualizados = {
            nome: cameraOriginal.nome,
            ip: cameraOriginal.ip,
            status: novoStatus
        };

        // 5. Envia a atualização (PUT) para o seu servidor salvar no banco SQLite
        const responseUpdate = await fetch(`${API_URL}/${cameraOriginal.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAtualizados)
        });

        if (responseUpdate.ok) {
            // 6. Recarrega a tela para atualizar o Gráfico, a Tabela e os Contadores automaticamente
            await carregarCamerasDoServidor();

            if (resultadoPing.online) {
                alert(`✅ Sucesso! A câmera respondeu ao ping e seu status foi alterado para "Ativa".`);
            } else {
                alert(`❌ Alerta! A câmera não respondeu e seu status foi alterado para "Inativa".`);
            }
        } else {
            alert("⚠️ O ping funcionou, mas houve um erro ao salvar o novo status no servidor.");
        }

    } catch (error) {
        console.error("Erro ao testar e atualizar status da câmera:", error);
        alert("⚠️ Erro interno ao tentar realizar o teste automático.");
    } finally {
        // Restaura o botão original
        botao.innerText = textoOriginal;
        botao.disabled = false;
    }
}

// ==========================================
// MONITORAMENTO AUTOMÁTICO (PING PERIÓDICO)
// ==========================================

async function executarPingAutomatico() {
    console.log("⚡ Iniciando verificação automática de rotina das câmeras...");
    
    // Se não houver câmeras cadastradas, não faz nada
    if (cameras.length === 0) return;

    // Percorre cada câmera cadastrada e roda o teste em segundo plano
    for (const camera of cameras) {

        if (camera.status === "Manutenção") continue; // Pula essa câmera e vai para a próxima

        try {
            // Chama a rota de ping do backend
            const responsePing = await fetch(`http://localhost:3000/api/cameras/ping/${camera.ip}`);
            const resultadoPing = await responsePing.json();

            // Define o novo status com base no ping
            const novoStatus = resultadoPing.online ? "Ativa" : "Inativa";

            // Só envia a atualização para o banco se o status tiver mudado de fato
            if (camera.status !== novoStatus) {
                const dadosAtualizados = {
                    nome: camera.nome,
                    ip: camera.ip,
                    status: novoStatus
                };

                await fetch(`${API_URL}/${camera.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosAtualizados)
                });
            }
        } catch (error) {
            console.error(`Erro no ping automático da câmera ${camera.ip}:`, error);
        }
    }

    // Após testar todas, atualiza a tabela, gráficos e contadores na tela de uma vez só
    carregarCamerasDoServidor();
    console.log("✅ Verificação de rotina concluída e painel atualizado!");
}

// Configura o temporizador para rodar a cada 2 minutos
// 2 minutos = 2 * 60 * 1000 = 120000 milissegundos
setInterval(executarPingAutomatico, 120000);