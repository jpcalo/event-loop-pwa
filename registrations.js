const registerToEvent = (db, req, res) => {
    const { event_id } = req.body;
    const user_id = req.user.id; 

    if (!event_id) {
        return res.status(400).json({ mensagem: "ID do evento é obrigatório." });
    }

    // 1. PRIMEIRO: Verificar se ESTE utilizador já está inscrito (Evita mensagens erradas)
    db.query('SELECT * FROM registrations WHERE user_id = ? AND event_id = ?', [user_id, event_id], (err, dupResults) => {
        if (err) return res.status(500).json({ mensagem: "Erro ao validar duplicados." });
        if (dupResults.length > 0) {
            return res.status(400).json({ mensagem: "💡 Já estás inscrito neste evento sustentável!" });
        }

        // 2. SEGUNDO: Se não estiver inscrito, vai ver a lotação do evento
        db.query('SELECT max_participants FROM events WHERE id = ?', [event_id], (err, eventResults) => {
            if (err) return res.status(500).json({ mensagem: "Erro ao consultar evento.", erro: err.message });
            if (eventResults.length === 0) return res.status(404).json({ mensagem: "Evento não encontrado." });

            const maxParticipants = eventResults[0].max_participants;

            // 3. TERCEIRO: Contar as inscrições totais do evento
            db.query('SELECT COUNT(*) AS total_inscritos FROM registrations WHERE event_id = ?', [event_id], (err, countResults) => {
                if (err) return res.status(500).json({ mensagem: "Erro ao contar inscrições.", erro: err.message });

                const totalInscritos = countResults[0].total_inscritos;

                // 4. REGRA DE NEGÓCIO: Verificar se atingiu o limite
                if (totalInscritos >= maxParticipants) {
                    return res.status(400).json({ mensagem: "🛑 Inscrição Recusada: Este evento já atingiu o limite máximo de participantes!" });
                }

                // 5. Se passou em tudo, grava na base de dados!
                db.query('INSERT INTO registrations (user_id, event_id) VALUES (?, ?)', [user_id, event_id], (err) => {
                    if (err) return res.status(500).json({ margin: "Erro ao efetuar a inscrição.", erro: err.message });
                    
                    return res.status(201).json({ mensagem: "🎉 Inscrição confirmada com sucesso! Garantiste o teu lugar." });
                });
            });
        });
    });
};

module.exports = { registerToEvent };