/* ==========================================================================
   ⚙️ SCRIPT DE AUTENTICAÇÃO - REGISTO DE UTILIZADORES (auth-register.js)
   ========================================================================== */

// Interceção do evento de submissão do formulário de registo
document.getElementById('regForm').addEventListener('submit', async (e) => {
    // Bloqueia o comportamento padrão de recarregamento da página do formulário
    e.preventDefault();
    
    // Captura dos valores inseridos nos campos de input do HTML
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    // Envio dos dados recolhidos para o endpoint correspondente na API do servidor
    const res = await fetch('/api/register', {
        method: 'POST', // Definição do método HTTP para criação de registo
        headers: { 'Content-Type': 'application/json' }, // Configuração do cabeçalho para formato JSON
        body: JSON.stringify({ name, email, password, role }) // Conversão do objeto JavaScript para string JSON
    });
    
    // Processamento e conversão da resposta assíncrona enviada pelo servidor
    const dados = await res.json();
    
    // Bloco de validação com base no estado de resposta HTTP da API
    if(res.ok) {
        // Fluxo de Sucesso: Define a formatação visual e exibe a mensagem positiva vinda do servidor
        document.getElementById('msg').style.color = "green";
        document.getElementById('msg').textContent = dados.mensagem;
        
        // Redirecionamento temporizado para a página de login após 1.5 segundos
        setTimeout(() => window.location.href = 'login.html', 1500);
    } else {
        // Fluxo de Erro: Modifica a cor do texto para alerta e apresenta o motivo da falha do registo
        document.getElementById('msg').style.color = "red";
        document.getElementById('msg').textContent = dados.mensagem;
    }
});