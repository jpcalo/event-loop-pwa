/* ==========================================================================
   ⚙️ NÚCLEO DO BACK-END - CONFIGURAÇÃO DO SERVIDOR (server.js)
   ========================================================================== */

// Importação de dependências e módulos do ecossistema Node.js
const express = require('express');
const mysql = require('mysql2');
const cookieParser = require('cookie-parser');
const path = require('path');

// Importação dos controladores modulares locais para rotas específicas
const auth = require('./auth');
const events = require('./events'); 
const registrations = require('./registrations'); 

// Inicialização da instância da aplicação Express
const app = express();

// Configuração de middlewares globais para tratamento de fluxos de dados
app.use(express.json()); // Parsing de requisições com payloads em formato JSON
app.use(express.urlencoded({ extended: true })); // Parsing de requisições codificadas em URL
app.use(cookieParser()); // Parsing de cookies para leitura de tokens de autenticação

// 1. CONFIGURAÇÃO DA LIGAÇÃO À BASE DE DADOS (MYSQL CONNECTION)
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '241231', 
    database: 'event_loop_db'
});

// Estabelecimento assíncrono da ligação com o motor de base de dados
db.connect((err) => {
    if (err) console.error('Erro no MySQL:', err);
    else console.log('MySQL Conectado e pronto para o CRUD!');
});

/* --------------------------------------------------------------------------
   2. ENDPOINTS DA API DE AUTENTICAÇÃO
   -------------------------------------------------------------------------- */
app.post('/api/register', (req, res) => auth.registerUser(db, req, res));
app.post('/api/login', (req, res) => auth.loginUser(db, req, res));
app.post('/api/logout', (req, res) => auth.logoutUser(db, req, res));

// Obtém o perfil do utilizador atualmente autenticado através do estado do token
app.get('/api/me', auth.protegerPagina, (req, res) => {
    const userId = req.user.id;

    // Execução de query para extrair o nome do utilizador correspondente ao ID da sessão
    db.query('SELECT name FROM users WHERE id = ?', [userId], (err, results) => {
        if (err || results.length === 0) {
            // Fallback de contingência caso a consulta falhe
            return res.json({
                name: "Utilizador",
                role: req.user.role
            });
        }

        // Devolução dos dados nominais guardados na tabela 'users'
        res.json({
            name: results[0].name, 
            role: req.user.role
        });
    });
});

/* --------------------------------------------------------------------------
   3. ENDPOINTS DA API DE EVENTOS (CRUD)
   -------------------------------------------------------------------------- */
// Operação CREATE com suporte a upload de ficheiro binário isolado (Multer Middleware)
app.post('/api/events', events.upload.single('image'), (req, res) => events.createEvent(db, req, res));      

// Operação READ com agregação relacional (LEFT JOIN) para contabilizar inscrições em tempo real
app.get('/api/events', (req, res) => {
    const query = `
        SELECT e.*, COUNT(r.id) AS total_inscritos 
        FROM events e
        LEFT JOIN registrations r ON e.id = r.event_id
        GROUP BY e.id
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ mensagem: 'Erro ao procurar eventos.', erro: err.message });
        }
        res.json(results);
    });
});         

app.get('/api/events/:id', (req, res) => events.getEventById(db, req, res));     
app.put('/api/events/:id', (req, res) => events.updateEvent(db, req, res));       
app.delete('/api/events/:id', (req, res) => events.deleteEvent(db, req, res));   

/* --------------------------------------------------------------------------
   4. ENDPOINTS DA API DE INSCRIÇÕES
   -------------------------------------------------------------------------- */
app.post('/api/registrations', auth.protegerPagina, (req, res) => registrations.registerToEvent(db, req, res));

/* --------------------------------------------------------------------------
   5. ROUTING E PROTEÇÃO DE VISTAS HTML (MIDDLEWARES DE CONTROLO DE ACESSO)
   -------------------------------------------------------------------------- */
// Proteção base: Apenas utilizadores com token ativo (regular ou admin) acedem à feed
app.get('/eventos.html', auth.protegerPagina, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'eventos.html'));
});

// Proteção restrita: Apenas contas com a role 'admin' têm permissão de leitura no painel
app.get('/dashboard.html', auth.protegerAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Entrega automática de recursos estáticos não mapeados (HTML, CSS, Imagens, JS local)
app.use(express.static('public'));

// Inicialização do servidor HTTP na porta lógica especificada
app.listen(3000, () => console.log('Servidor totalmente operacional na porta 3000'));