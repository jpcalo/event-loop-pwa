/* ==========================================================================
   ⚙️ SCRIPT DE AUTENTICAÇÃO - LOGIN DE UTILIZADORES (auth-login.js)
   ========================================================================== */

// Interceção do evento de submissão do formulário de autenticação
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    // Bloqueia o comportamento padrão de recarregamento automático da página
    e.preventDefault();
    
    // Captura das credenciais inseridas nos campos de texto do HTML
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // Envio do pedido de autenticação via método HTTP POST para o endpoint da API
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }) // Conversão do objeto JavaScript para string JSON
        });

        // Desserialização da resposta do servidor para leitura do objeto JSON
        const dados = await res.json();

        // Validação do estado de resposta HTTP enviado pela API do servidor
        if (res.ok) {
            // Configuração do feedback visual positivo no ecrã do utilizador
            document.getElementById('msg').style.color = "green";
            document.getElementById('msg').textContent = "Login efetuado! A redirecionar...";
            
            // Mecanismo de redirecionamento condicional temporizado com base no nível de acesso (role)
            setTimeout(() => {
                if (dados.role === 'admin') {
                    // Direciona utilizadores com privilégios de gestão para a área de controlo administrativa
                    window.location.href = 'dashboard.html';
                } else {
                    // Direciona utilizadores comuns para o catálogo principal de iniciativas ecológicas
                    window.location.href = 'eventos.html';
                }
            }, 1000); // Executa a rota de destino exatamente 1 segundo após a confirmação
        } else {
            // Gestão de erros lógicos (ex: credenciais incorretas) devolvidos pela base de dados
            document.getElementById('msg').style.color = "red";
            document.getElementById('msg').textContent = dados.mensagem;
        }
    } catch (error) {
        // Bloco de exceção para falhas físicas ou quebras na rede de comunicação com o servidor
        document.getElementById('msg').style.color = "red";
        document.getElementById('msg').textContent = "Erro ao ligar ao servidor.";
    }
});