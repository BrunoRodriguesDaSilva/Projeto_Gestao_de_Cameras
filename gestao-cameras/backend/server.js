// backend/server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// ==========================================
// MIDDLEWARES
// ==========================================
app.use(cors()); // Libera o acesso para o seu frontend rodar sem bloqueios de segurança (CORS)
app.use(express.json()); // Configura o servidor para entender dados enviados em formato JSON

// ==========================================
// CONEXÃO E CONFIGURAÇÃO DO BANCO DE DADOS (SQLite)
// ==========================================
// Cria ou lê o arquivo 'database.sqlite' dentro da pasta backend
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('💾 Conectado com sucesso ao banco de dados SQLite.');
    }
});

// Inicialização da Tabela permanente de Câmeras
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS cameras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            ip TEXT NOT NULL,
            status TEXT NOT NULL
        )
    `, (err) => {
        if (err) console.error('❌ Erro ao criar/verificar a tabela:', err.message);
        else console.log('📋 Tabela "cameras" verificada e pronta para uso.');
    });
});

// ==========================================
// ROTAS DA API (CRUD)
// ==========================================

// 1. ROTA DE TESTE (Acesse http://localhost:3000/ no navegador para testar)
app.get('/', (req, res) => {
    res.json({ mensagem: "API GestaCam rodando com sucesso! 📹" });
});

// 2. LISTAR TODAS AS CÂMERAS (READ)
// Rota acionada pelo frontend ao carregar a página ou mudar filtros
app.get('/api/cameras', (req, res) => {
    db.all("SELECT * FROM cameras", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows); // Devolve a lista de câmeras encontradas no banco
    });
});

// 3. ADICIONAR NOVA CÂMERA (CREATE)
// Rota acionada quando o formulário do modal envia uma nova câmera
app.post('/api/cameras', (req, res) => {
    const { nome, ip, status } = req.body;

    // Insere os dados de forma segura usando placeholders (?) contra SQL Injection
    const sql = "INSERT INTO cameras (nome, ip, status) VALUES (?, ?, ?)";
    const params = [nome, ip, status];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // Retorna a câmera recém-criada com o ID correto gerado pelo banco
        res.status(201).json({ id: this.lastID, nome, ip, status });
    });
});

// 4. ATUALIZAR CÂMERA EXISTENTE (UPDATE)
// Rota acionada pelo botão salvar do modal quando estamos em modo de edição
app.put('/api/cameras/:id', (req, res) => {
    const { nome, ip, status } = req.body;
    const { id } = req.params;

    const sql = "UPDATE cameras SET nome = ?, ip = ?, status = ? WHERE id = ?";
    const params = [nome, ip, status, id];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            mensagem: "Câmera atualizada com sucesso!",
            linhasAfetadas: this.changes
        });
    });
});

// 5. EXCLUIR CÂMERA (DELETE)
// Rota acionada ao clicar em excluir e confirmar no alerta
app.delete('/api/cameras/:id', (req, res) => {
    const { id } = req.params;

    db.run("DELETE FROM cameras WHERE id = ?", id, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            mensagem: "Câmera excluída com sucesso!",
            linhasAfetadas: this.changes
        });
    });
});

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend rodando em: http://localhost:${PORT}`);
    console.log(`💡 Pressione CTRL + C no terminal para desligar o servidor.`);
});

const { exec } = require('child_process');

// ROTA PARA TESTAR O PING DA CÂMERA
app.get('/api/cameras/ping/:ip', (req, res) => {
    const ip = req.params.ip;

    // Comando padrão para Windows (-n 2 envia apenas 2 pacotes para ser rápido)
    // Se você usa Linux/Mac no servidor, mude "-n 2" para "-c 2"
    const comando = `ping -n 2 ${ip}`;

    exec(comando, (error, stdout, stderr) => {
        if (error) {
            // Se der erro, significa que o dispositivo não respondeu (Offline)
            return res.json({ online: false, msg: "Dispositivo inacessível" });
        }

        // Se não deu erro, o ping respondeu com sucesso (Online)
        return res.json({ online: true, msg: "Dispositivo online" });
    });
});