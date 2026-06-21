const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = "segredo_do_event_loop_123"; // Uma chave para assinar os tokens

// 1. Lógica de Registo
const registerUser = async (db, req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ mensagem: "Preencha todos os campos obrigatórios." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role || 'regular';

        db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
        [name, email, hashedPassword, userRole], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ mensagem: "Este email já está registado." });
                }
                return res.status(500).json({ mensagem: "Erro ao guardar no banco." });
            }
            return res.status(201).json({ mensagem: "Utilizador registado com sucesso!" });
        });
    } catch (e) {
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// 2. Lógica de Login (Gera o Cookie)
const loginUser = (db, req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ mensagem: "Credenciais inválidas." });
        }

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        
        if (!match) {
            return res.status(401).json({ mensagem: "Credenciais inválidas." });
        }

        // Criar o token de sessão (Expira em 15 minutos)
        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '15m' });

        // Guardar o token num Cookie seguro (httpOnly) (Expira em 15 minutos)
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 15 * 60 * 1000 // 15 minutos em milissegundos
        });

        return res.json({ mensagem: "Login feito com sucesso!", role: user.role });
    });
};

// 3. O Guarda das Páginas (Middleware de Proteção)
const protegerPagina = (req, res, next) => {
    const token = req.cookies.token;

    // Se não tiver o cookie de login, o servidor redireciona imediatamente para o login.html
    if (!token) {
        return res.redirect('/login.html');
    }

    try {
        const verificado = jwt.verify(token, SECRET_KEY);
        req.user = verificado; // Guarda os dados do utilizador no pedido
        next(); // Permite avançar para a página pretendida
    } catch (err) {
        res.clearCookie('token');
        return res.redirect('/login.html');
    }
};

// Certifica-te de que adicionas a função de logout no final
const logoutUser = (db, req, res) => {
    res.clearCookie('token');
    return res.redirect('/login.html'); // Após limpar o cookie, redireciona para a página de login
};

// O Guarda exclusivo para o Administrador
const protegerAdmin = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/login.html');
    }

    try {
        const verificado = jwt.verify(token, SECRET_KEY);
        req.user = verificado;

        // ⚠️ Se o utilizador não for admin, o servidor barra a entrada!
        if (req.user.role !== 'admin') {
            return res.status(403).send(`
                <div style="font-family: Arial, sans-serif; text-align: center; padding-top: 100px; background: #f4fdf9; height: 100vh; box-sizing: border-box;">
                    <div style="background: white; padding: 40px; display: inline-block; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); max-width: 400px;">
                        <h2 style="color: #e74c3c; margin-top: 0;">🛑 Acesso Negado</h2>
                        <p style="color: #2c3e50; font-size: 16px; line-height: 1.5;">Esta área é exclusiva para Administradores da plataforma Event Loop.</p>
                        <br>
                        <a href="/index.html" style="display: inline-block; background: #2ecc71; color: white; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: bold; transition: background 0.2s;">Voltar à Página Inicial</a>
                    </div>
                </div>
            `);
        }

        next();
    } catch (err) {
        res.clearCookie('token');
        return res.redirect('/login.html');
    }
};

// ATENÇÃO: Adiciona a nova função 'protegerAdmin' aqui no fim do teu exports atual:
module.exports = { registerUser, loginUser, protegerPagina, logoutUser, protegerAdmin };