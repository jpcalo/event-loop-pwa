/* ==========================================================================
   ⚙️ SCRIPT PRINCIPAL - PAINEL DE GESTÃO ADMINISTRATIVA (main-dashboard.js)
   ========================================================================== */

// 1. INICIALIZAÇÃO E CONTROLO DE SESSÃO DO ADMINISTRADOR
// Executa o bloco assim que a árvore DOM estiver completamente construída
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Valida o estado da sessão do utilizador atual junto do servidor
        const resposta = await fetch('/api/me');
        if (resposta.ok) {
            const dadosUtilizador = await resposta.json();
            // Renderiza a barra de navegação com a identificação do contexto administrativo
            inicializarNavbar('dashboard', dadosUtilizador.role, dadosUtilizador.name);
        }
    } catch (error) {
        console.error("Erro ao carregar a Navbar do Admin:", error);
    }
});

// Referências globais a elementos do DOM e estado da aplicação
const eventForm = document.getElementById('eventForm');
let listaEventosLocais = []; // Cache em memória para otimizar as operações de edição síncrona

/* --------------------------------------------------------------------------
   2. LEITURA E LISTAGEM DE REGISTOS (READ)
   -------------------------------------------------------------------------- */
// Procura as instâncias na BD e reconstrói dinamicamente a tabela/lista de gestão
async function carregarEventos() {
    const container = document.getElementById('eventsContainer');
    container.innerHTML = "<p>A carregar eventos...</p>";

    try {
        // Pedido GET para extração do catálogo completo de eventos
        const resposta = await fetch('/api/events');
        listaEventosLocais = await resposta.json();

        // Validação de estado lógico para tabelas vazias
        if (listaEventosLocais.length === 0) {
            container.innerHTML = "<p>Nenhum evento registado.</p>";
            return;
        }

        container.innerHTML = "";
        
        // Iteração e renderização dos cartões com controlos de modificação (Editar/Eliminar)
        listaEventosLocais.forEach(evento => {
            const dataFormatada = new Date(evento.event_date).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });

            // Validação de caminhos de ficheiro multimédia (Imagens/Cartazes)
            const tagImagem = evento.image_path 
                ? `<img src="${evento.image_path}" alt="Cartaz" style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 15px;">`
                : `<div style="width: 80px; height: 60px; background: #e0e0e0; border-radius: 4px; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #7f8c8d;">Sem foto</div>`;

            const card = document.createElement('div');
            card.className = 'event-card';
            card.style.display = 'flex';
            card.style.alignItems = 'center';
            card.style.justifyContent = 'space-between';
            
            card.innerHTML = `
                <div style="display: flex; align-items: center;">
                    ${tagImagem}
                    <div>
                        <h4 class="event-title" style="margin: 0 0 5px 0;">${evento.title}</h4>
                        <p style="margin: 0 0 5px 0; font-size: 14px; color: #7f8c8d;">${evento.description}</p>
                        <div class="event-info">📍 <b>Local:</b> ${evento.location} | 📅 <b>Data:</b> ${dataFormatada} | 👥 <b>Vagas:</b> ${evento.max_participants} max</div>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="prepararEdicao(${evento.id})">Editar</button>
                    <button class="btn-delete" onclick="eliminarEvento(${evento.id})">Eliminar</button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        container.innerHTML = "<p style='color:red;'>Erro ao ligar ao servidor.</p>";
    }
}

/* --------------------------------------------------------------------------
   3. PROCESSAMENTO DE FORMULÁRIOS (CRIAR / ATUALIZAR)
   -------------------------------------------------------------------------- */
// Interceta e bifurca o comportamento do formulário entre criação (POST) ou edição (PUT)
eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Mapeamento das variáveis do formulário HTML
    const id = document.getElementById('eventId').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const location = document.getElementById('location').value;
    const event_date = document.getElementById('event_date').value;
    const category = document.getElementById('category').value;
    const max_participants = document.getElementById('max_participants').value;

    try {
        let resposta;

        if (id) {
            // MODO DE ATUALIZAÇÃO (PUT): Serialização de dados puramente textuais em JSON
            const dadosEvento = { title, description, location, event_date, category, max_participants };
            
            resposta = await fetch(`/api/events/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosEvento)
            });
        } else {
            // MODO DE CRIAÇÃO (POST): Instanciação de FormData para suportar o upload de ficheiros binários
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('location', location);
            formData.append('event_date', event_date);
            formData.append('category', category);
            formData.append('max_participants', max_participants);

            // Verificação e injeção do ficheiro de imagem capturado pelo input file
            const imageInput = document.getElementById('image');
            if (imageInput && imageInput.files[0]) {
                formData.append('image', imageInput.files[0]);
            }

            resposta = await fetch('/api/events', {
                method: 'POST',
                body: formData // Nota: O cabeçalho 'Content-Type' multipart/form-data é gerado automaticamente pelo browser
            });
        }

        const resultado = await resposta.json();
        alert(resultado.mensagem);

        // Limpeza dos campos e atualização do feed em caso de persistência bem-sucedida
        if (resposta.ok) {
            eventForm.reset();
            cancelarEdicao();
            carregarEventos(); 
        }
    } catch (error) {
        alert("Erro ao processar o pedido no servidor.");
    }
});

/* --------------------------------------------------------------------------
   4. GESTÃO DE MODOS DA INTERFACE (UPDATE - AUXILIARES)
   -------------------------------------------------------------------------- */
// Ativa o estado de edição, injetando os valores do registo selecionado de volta nos inputs
function prepararEdicao(id) {
    const evento = listaEventosLocais.find(e => e.id === id);
    if (!evento) return;

    // Adaptação da data para conformidade com o formato exigido pelo input datetime-local
    const dataIso = new Date(evento.event_date).toISOString().slice(0, 16);

    document.getElementById('eventId').value = evento.id;
    document.getElementById('title').value = evento.title;
    document.getElementById('description').value = evento.description;
    document.getElementById('location').value = evento.location;
    document.getElementById('event_date').value = dataIso;
    document.getElementById('category').value = evento.category;
    document.getElementById('max_participants').value = evento.max_participants;

    // Modificações estéticas nos componentes de rotulagem do formulário
    document.getElementById('formTitle').textContent = "✍️ Editar Evento Selecionado";
    document.getElementById('btnSubmitForm').textContent = "Guardar Alterações";
    document.getElementById('btnSubmitForm').style.background = "#f39c12";
    document.getElementById('btnCancelEdit').style.display = "block";
    
    // Oculta o campo de imagem para assegurar que modificações rápidas não substituem o cartaz existente
    const imageField = document.getElementById('image');
    if (imageField) imageField.style.display = "none";
    
    // Animação de Scroll para posicionar a janela no topo do formulário de modificações
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Reverte o formulário para o seu estado inicial de criação de novos registos
function cancelarEdicao() {
    document.getElementById('eventId').value = "";
    eventForm.reset();
    document.getElementById('formTitle').textContent = "Anunciar Novo Evento Sustentável";
    document.getElementById('btnSubmitForm').textContent = "Submeter Evento";
    document.getElementById('btnSubmitForm').style.background = "#2ecc71";
    document.getElementById('btnCancelEdit').style.display = "none";
    
    const imageField = document.getElementById('image');
    if (imageField) imageField.style.display = "block";
}

/* --------------------------------------------------------------------------
   5. REMOÇÃO DE REGISTOS (DELETE)
   -------------------------------------------------------------------------- */
// Dispara um pedido de eliminação física de um registo com base no seu ID único
async function eliminarEvento(id) {
    if (!confirm("Queres mesmo eliminar este evento?")) return;

    try {
        const resposta = await fetch(`/api/events/${id}`, { method: 'DELETE' });
        const resultado = await resposta.json();
        alert(resultado.mensagem);
        carregarEventos(); // Atualiza a grelha de gestão de dados
    } catch (error) {
        alert("Erro ao eliminar.");
    }
}

// Inicialização automática do carregamento dos dados da tabela
carregarEventos();