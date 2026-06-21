/* ==========================================================================
   ⚙️ SCRIPT PRINCIPAL - FEED E GESTÃO DE EVENTOS (main-eventos.js)
   ========================================================================== */

// 1. INICIALIZAÇÃO E CONTROLO DE SESSÃO
// Executa o bloco assim que a árvore DOM estiver completamente construída
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Valida o estado da sessão do utilizador atual junto do servidor
        const resposta = await fetch('/api/me');
        if (resposta.ok) {
            const dadosUtilizador = await resposta.json();
            // Renderiza a barra de navegação dinâmica com base no nível de acesso e nome do utilizador
            inicializarNavbar('eventos', dadosUtilizador.role, dadosUtilizador.name);
        }
    } catch (error) {
        console.error("Erro ao carregar dados do utilizador para a Navbar:", error);
    }
});

// 2. REGISTO DO SERVICE WORKER (SUPORTE PWA)
// Verifica se o navegador suporta a tecnologia de Service Workers para execução offline
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker ativo com sucesso!', reg.scope))
            .catch(err => console.log('Erro ao registar o Service Worker:', err));
    });
}

// Variáveis de estado global da aplicação
let todosOsEventos = []; 
let favoritos = JSON.parse(localStorage.getItem('event_loop_favs')) || []; // Persistência local de favoritos
let apenasFavoritos = false; // Flag de controlo do filtro de visualização

// 3. CONSUMO DA API DE EVENTOS (MÉTODO GET)
// Procura assincronamente a lista de todas as iniciativas ecológicas na base de dados
async function carregarEventosPublicos() {
    try {
        const resposta = await fetch('/api/events');
        todosOsEventos = await resposta.json();
        desenharEventos(todosOsEventos);
    } catch (error) {
        document.getElementById('publicEventsContainer').innerHTML = "<p style='color:red;'>Erro ao ligar ao servidor.</p>";
    }
}

// 4. RENDERIZAÇÃO DINÂMICA DA INTERFACE (DOM MANIPULATION)
// Constrói os cartões HTML correspondentes aos eventos com base nos filtros ativos
function desenharEventos(lista) {
    const container = document.getElementById('publicEventsContainer');
    
    // Aplicação do filtro de favoritos através do método filter (JavaScript funcional)
    const listaFinal = apenasFavoritos ? lista.filter(e => favoritos.includes(e.id)) : lista;

    // Tratamento de estados sem registos correspondentes
    if (listaFinal.length === 0) {
        container.innerHTML = apenasFavoritos 
            ? "<p>Ainda não marcaste nenhum evento como favorito com a estrela! ⭐</p>"
            : "<p>Nenhum evento corresponde à tua pesquisa.</p>";
        return;
    }

    container.innerHTML = "";
    
    // Iteração sobre a lista de dados para a criação individual dos nós de interface
    listaFinal.forEach(evento => {
        // Formatação de data padronizada para a localização pt-PT
        const dataFormatada = new Date(evento.event_date).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
        
        // Verificação lógica da capacidade limite de inscrições do evento
        const estaCheio = evento.total_inscritos >= evento.max_participants;
        const textoVagas = estaCheio 
            ? `<b style="color: #e74c3c;">🔴 Esgotado</b>` 
            : `<b style="color: #27ae60;">🍏 Vagas: ${evento.total_inscritos} / ${evento.max_participants}</b>`;

        // Controlo visual do estado de favoritismo (Ícones Unicode)
        const eFavorito = favoritos.includes(evento.id);
        const iconeEstrela = eFavorito ? '⭐' : '☆';

        // Injeção de estrutura de cartões dinâmicos no container alvo
        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
            <img src="${evento.image_path || '/uploads/default-eco.png'}" alt="Cartaz" style="width: 100%; height: 150px; object-fit: cover; border-radius: 6px; margin-bottom: 12px;">
            
            <button class="btn-fav" onclick="alternarFavorito(${evento.id})">${iconeEstrela}</button>
            <div>
                <h4 class="event-title">${evento.title}</h4>
                <div class="event-meta">📍 <b>Local:</b> ${evento.location}</div>
                <div class="event-meta">📅 <b>Data:</b> ${dataFormatada}</div>
                <div class="event-meta">🏷️ <b>Categoria:</b> ${evento.category}</div>
                <div class="event-meta">👥 <b>Estado:</b> ${textoVagas}</div>
            </div>
            <button class="btn-view" onclick="abrirDetalhes(${evento.id})">Saber Mais & Inscrever</button>
        `;
        container.appendChild(card);
    });
}

// 5. GESTÃO DE ESTADO DE FAVORITOS (LOCALSTORAGE API)
// Adiciona ou remove IDs de eventos do array de favoritos armazenado localmente no browser
function alternarFavorito(id) {
    if (favoritos.includes(id)) {
        favoritos = favoritos.filter(favId => favId !== id); 
    } else {
        favoritos.push(id); 
    }
    localStorage.setItem('event_loop_favs', JSON.stringify(favoritos)); 
    desenharEventos(todosOsEventos); 
}

// Inverte o estado de filtragem por favoritos e atualiza os elementos estéticos do botão
function toggleMostrarApenasFavoritos() {
    apenasFavoritos = !apenasFavoritos;
    const btn = document.getElementById('btnFiltroFav');
    btn.style.background = apenasFavoritos ? '#2ecc71' : 'white';
    btn.style.color = apenasFavoritos ? 'white' : 'black';
    desenharEventos(todosOsEventos);
}

// 6. MOTOR DE FILTRAGEM E PESQUISA EM TEMPO REAL
// Executa a filtragem combinada (por texto de pesquisa e por categoria selecionada)
function filtrarEventos() {
    const termoPesquisa = document.getElementById('searchBar').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;

    const eventosFiltrados = todosOsEventos.filter(evento => {
        const correspondeTexto = evento.title.toLowerCase().includes(termoPesquisa) || evento.location.toLowerCase().includes(termoPesquisa);
        const correspondeCategoria = categoryFilter === "" || evento.category === categoryFilter;
        return correspondeTexto && correspondeCategoria;
    });

    desenharEventos(eventosFiltrados);
}

// 7. JANELA MODAL DE DETALHES
// Procura os dados detalhados de um evento e preenche a estrutura da janela modal
function abrirDetalhes(id) {
    const evento = todosOsEventos.find(e => e.id === id);
    if (!evento) return;

    const dataFormatada = new Date(evento.event_date).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });

    // Mapeamento dos valores textuais para os ID homólogos na folha HTML
    document.getElementById('modalTitle').textContent = evento.title;
    document.getElementById('modalDesc').textContent = evento.description;
    document.getElementById('modalLocation').textContent = evento.location;
    document.getElementById('modalDate').textContent = dataFormatada;
    document.getElementById('modalCategory').textContent = evento.category;
    document.getElementById('modalMaxParticipants').textContent = `${evento.total_inscritos} / ${evento.max_participants}`;

    // Inicialização do estado visual dos componentes de emissão de bilhetes
    document.getElementById('ticketZone').style.display = 'none';
    document.getElementById('qrcode').innerHTML = "";

    const modalRegisterBtn = document.getElementById('modalRegisterBtn');
    const estaCheio = evento.total_inscritos >= evento.max_participants;

    // Gestão de acessibilidade do botão de submissão com base no estado de lotação
    if (estaCheio) {
        modalRegisterBtn.textContent = "Esgotado ❌";
        modalRegisterBtn.style.background = "#7f8c8d";
        modalRegisterBtn.disabled = true;
        modalRegisterBtn.onclick = null;
    } else {
        modalRegisterBtn.textContent = "Garantir o meu Lugar 📝";
        modalRegisterBtn.style.background = "#2ecc71";
        modalRegisterBtn.style.display = "block";
        modalRegisterBtn.disabled = false;
        modalRegisterBtn.onclick = () => inscreverNoEvento(evento.id, evento.title);
    }

    document.getElementById('eventModal').style.display = 'flex';
}

// Oculta a visualização da modal de detalhes através de manipulação de propriedades CSS
function fecharDetalhes() {
    document.getElementById('eventModal').style.display = 'none';
}

// 8. PERSISTÊNCIA DE INSCRIÇÕES E GERAÇÃO DE QR CODE (MÉTODO POST)
// Regista a participação do utilizador conectado na base de dados (tabela registrations)
async function inscreverNoEvento(id, titulo) {
    try {
        const resposta = await fetch('/api/registrations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_id: id })
        });

        const resultado = await resposta.json();
        alert(resultado.mensagem);

        if (resposta.ok) {
            // Oculta o botão após o sucesso para prevenir duplo registo
            document.getElementById('modalRegisterBtn').style.display = 'none';

            // Instanciação e renderização da biblioteca QRCode.js com string gerada em tempo de execução
            const dadosDoBilhete = `EventLoop-Ticket-ID:${id}-${Date.now()}`;
            new QRCode(document.getElementById("qrcode"), {
                text: dadosDoBilhete,
                width: 128,
                height: 128,
                colorDark : "#2c3e50",
                colorLight : "#ffffff"
            });

            document.getElementById('ticketZone').style.display = 'block';
            carregarEventosPublicos(); // Atualiza contadores e métricas de lotação em segundo plano
        }

    } catch (error) {
        alert("Erro ao tentar processar a inscrição.");
    }
}

// Inicialização síncrona do fluxo de dados da vista
carregarEventosPublicos();