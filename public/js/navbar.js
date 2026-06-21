function inicializarNavbar(paginaAtiva, userRole, userName) {
    let headerTag = document.querySelector('header');
    if (!headerTag) {
        headerTag = document.createElement('header');
        document.body.insertBefore(headerTag, document.body.firstChild);
    }

    const nomeExibicao = userName && userName !== 'undefined' ? userName : 'Utilizador';

    // Link do Dashboard (Apenas para Admin)
    const linkAdmin = userRole === 'admin' 
        ? `<li><a href="dashboard.html" class="nav-link nav-admin-link ${paginaAtiva === 'dashboard' ? 'active' : ''}">🛠️ Dashboard</a></li>` 
        : '';

    // Injeta a estrutura HTML correta e dividida em 3 blocos
    headerTag.innerHTML = `
        <nav class="custom-navbar">
            <ul class="nav-menu" id="navMenu">
                <li><a href="eventos.html" class="nav-link ${paginaAtiva === 'eventos' ? 'active' : ''}">📅 Eventos</a></li>
                ${linkAdmin}
            </ul>

            <a href="eventos.html" class="nav-logo">Event Loop 🌿</a>
        
            <div class="nav-user-zone" id="navUserZone">
                <span class="nav-user-name">👤 ${nomeExibicao}</span>
                <form action="/api/logout" method="POST" class="nav-logout-form">
                    <button type="submit" class="btn-logout-nav">Sair</button>
                </form>
            </div>

            <button class="nav-toggle" id="navToggle" aria-label="Abrir menu">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </nav>
    `;

    // 🔒 Ajuste com Timeout para blindar a ativação do menu no Mobile
    setTimeout(() => {
        const toggleBtn = document.getElementById('navToggle');
        const menu = document.getElementById('navMenu');
        const userZone = document.getElementById('navUserZone');
    
        if (toggleBtn && menu && userZone) {
            toggleBtn.onclick = function() {
                menu.classList.toggle('open');
                userZone.classList.toggle('open');
            };
        }
    }, 50);
}