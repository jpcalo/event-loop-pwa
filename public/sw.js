/* ==========================================================================
   🤖 SERVICE WORKER - EVENT LOOP PWA
   ========================================================================== */

// Nome da versão do armazenamento em cache
const CACHE_NAME = 'event-loop-cache-v1';

// Recursos estáticos estruturais (App Shell) que serão guardados para uso offline
const ASSETS_TO_CACHE = [
  '/login.html',
  '/register.html',
  '/eventos.html',
  '/index.html'
];

/* --------------------------------------------------------------------------
   1. EVENTO DE INSTALAÇÃO (install)
   -------------------------------------------------------------------------- */
// Interceta a inicialização da PWA e força o armazenamento da lista de ativos na cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

/* --------------------------------------------------------------------------
   2. EVENTO DE ATIVAÇÃO (activate)
   -------------------------------------------------------------------------- */
// Controla a transição do Service Worker e remove versões antigas de cache do dispositivo
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

/* --------------------------------------------------------------------------
   3. INTERCEÇÃO DE PEDIDOS HTTP (fetch)
   -------------------------------------------------------------------------- */
// Atua como um proxy de rede para decidir a origem do carregamento de cada recurso
self.addEventListener('fetch', (e) => {

  // Exceção para rotas dinâmicas: Pedidos de API e uploads de imagens contornam a cache
  if (e.request.url.includes('/api/') || e.request.url.includes('/uploads/')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Estratégia Network-First para ficheiros de navegação HTML (.html e caminhos de rota)
  if (e.request.mode === 'navigate' || e.request.url.endsWith('.html')) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          // Se a rede estiver disponível, atualiza dinamicamente a cache com a resposta clonada
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // Mecanismo de contingência (Fallback): Carrega a versão local da cache em modo offline
          return caches.match(e.request);
        })
    );
    return;
  }

  // Estratégia Cache-First para ativos estáticos locais (CSS, JS estático, Imagens de interface)
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});