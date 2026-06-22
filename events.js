const multer = require('multer');
const path = require('path');

// ==========================================
// CONFIGURAÇÃO DO ARMAZENAMENTO DO MULTER
// ==========================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/'); // Guarda as imagens nesta pasta pública
    },
    filename: (req, file, cb) => {
        // Gera um nome único usando o timestamp atual para evitar ficheiros duplicados
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// ==========================================
// CONTROLADORES DO CRUD DE EVENTOS
// ==========================================

// 1. Criar um Novo Evento (CREATE - Atualizado com Multer)
const createEvent = (db, req, res) => {
    const { title, description, event_date, location, category, max_participants } = req.body;

    // Validação básica dos campos obrigatórios
    if (!title || !description || !event_date || !location || !category || !max_participants) {
        return res.status(400).json({ mensagem: "Preencha todos os campos obrigatórios do evento." });
    }

    // Se o utilizador submeteu uma imagem, guardamos o caminho. Caso contrário, passamos null.
    const image_path = req.file ? `/uploads/${req.file.filename}` : null;

    const query = `INSERT INTO events (title, description, image_path, event_date, location, category, max_participants) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [title, description, image_path, event_date, location, category, max_participants], (err, result) => {
        if (err) {
            return res.status(500).json({ mensagem: "Erro ao inserir o evento na base de dados.", erro: err.message });
        }
        return res.status(201).json({ mensagem: "Evento sustentável criado com sucesso!", eventId: result.insertId });
    });
};

// 2. Listar Todos os Eventos (READ - Listagem)
const getAllEvents = (db, req, res) => {
    db.query('SELECT * FROM events ORDER BY event_date ASC', (err, results) => {
        if (err) {
            return res.status(500).json({ mensagem: "Erro ao procurar eventos.", erro: err.message });
        }
        return res.json(results);
    });
};

// 3. Ver Detalhe de um Evento Específico (READ - Detalhe)
const getEventById = (db, req, res) => {
    const eventId = req.params.id;

    db.query('SELECT * FROM events WHERE id = ?', [eventId], (err, results) => {
        if (err) return res.status(500).json({ mensagem: "Erro no servidor.", erro: err.message });
        if (results.length === 0) return res.status(404).json({ mensagem: "Evento não encontrado." });
        
        return res.json(results[0]);
    });
};

// 4. Atualizar um Evento (UPDATE)
const updateEvent = (db, req, res) => {
    const eventId = req.params.id;
    const { title, description, image_path, event_date, location, category, max_participants } = req.body;

    const query = `UPDATE events SET title = ?, description = ?, image_path = ?, event_date = ?, location = ?, category = ?, max_participants = ? 
                   WHERE id = ?`;

    db.query(query, [title, description, image_path || null, event_date, location, category, max_participants, eventId], (err, result) => {
        if (err) return res.status(500).json({ mensagem: "Erro ao atualizar o evento.", erro: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ mensagem: "Evento não encontrado para atualizar." });

        return res.json({ margin: "Evento updated com sucesso!" });
    });
};

// 5. Eliminar um Evento (DELETE)
const deleteEvent = (db, req, res) => {
    const eventId = req.params.id;

    db.query('DELETE FROM events WHERE id = ?', [eventId], (err, result) => {
        if (err) return res.status(500).json({ mensagem: "Erro ao eliminar o evento.", erro: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ mensagem: "Evento não encontrado para eliminar." });

        return res.json({ mensagem: "Evento eliminado com sucesso da plataforma!" });
    });
};

// Exportamos as funções originais e também o middleware 'upload' para o server.js usar
module.exports = { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent, upload };
