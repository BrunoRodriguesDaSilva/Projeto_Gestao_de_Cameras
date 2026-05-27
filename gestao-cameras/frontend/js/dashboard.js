const API_URL = "http://localhost:3000/api/cameras";
let cameras = [];
let filtroStatusAtual = "Todos";
let chartInstance = null;

// ==========================================
// INICIALIZAÇÃO E SEGURANÇA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Verifica se o usuário passou pela tela de login
    if (localStorage.getItem('isLogged') !== 'true') {
        window.location.href = 'index.html';
        return;
    }
    carregarCamerasDoServidor();
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
// LÓGICA DO GRÁFICO (Chart.js)
// ==========================================
function atualizarGrafico() {
    const total = cameras.length;
    const ativas = cameras.filter(c => c.status === "Ativa").length;
    const inativas = cameras.filter(c => c.status === "Inativa").length;
    const manutencao = cameras.filter(c => c.status === "Manutenção").length;

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
                        label: function(context) {
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
        if(s === status) {
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