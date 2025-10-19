import { showToast } from './modules/toast.js';

import { setupCarousel } from './modules/carousel.js';

import { setupTheme } from './modules/theme.js';

import { setupMobileNav } from './modules/nav.js';

import { setupScrollIndicator } from './modules/scroll.js';

import { 
    handleUserSession, 
    setupAuthEventListeners 
} from './modules/auth.js';

import { 
    getCart, 
    saveCart, 
    updateItemQuantity, 
    removeItemFromCart, 
    clearCart,
    addToCart
} from './modules/cart.js';

import { 
    fetchAllProducts, 
    fetchProductById, 
    fetchUserOrders, 
    createOrder, 
    fetchProductsByIds,
    fetchAllUserAds,
    fetchMyAds,
    createAd,
    createTradeProposal,
    updateAdStatus,
    fetchAdById,
    fetchAdsByIds,
    getProfile, 
    updateProfile,
    fetchPromotionalProducts,
    fetchNewestProducts,
} from './modules/api.js';

import { 
    updateCartCount, 
    renderProducts, 
    renderProductDetails, 
    renderOrders, 
    renderCartPage,
    renderUserAds,
    renderMyAds,
    renderAdDetails,
    renderProfilePage,
    renderPromotionalProducts,
    renderDepartments
} from './modules/ui.js';

// --- EVENTO GLOBAL ---
window.addEventListener('cartUpdated', updateCartCount);

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    handleUserSession();
    updateCartCount();
    setupAuthEventListeners();
    setupMobileNav();
    setupTheme();
    setupScrollIndicator();
    setupSearchAndFilters();
    router();
});

// --- ROTEADOR ---
async function router() {
    const path = window.location.pathname;

    // Página Inicial
if (path.endsWith('index.html') || path.endsWith('/')) {
    // --- CARREGAMENTO DA PÁGINA INICIAL ---

    // 1. Renderiza os departamentos (são estáticos, não precisam de API)
    const departmentsGrid = document.getElementById('departments-grid');
    renderDepartments(departmentsGrid);

    setupCarousel();

    const ctaButton = document.querySelector('.cta-button');
    const productsSection = document.getElementById('products');
    if (ctaButton && productsSection) {
        ctaButton.addEventListener('click', (e) => {
            e.preventDefault(); // Previne o comportamento padrão do link
            productsSection.scrollIntoView({ behavior: 'smooth' }); // Rola suavemente até a seção
        });
    }

    // 2. Busca e renderiza as promoções e os recém-chegados em paralelo
    const promoListEl = document.getElementById('promotions-list');
    const newListEl = document.getElementById('new-arrivals-list');

    const [promoResponse, newArrivalsResponse] = await Promise.all([
        fetchPromotionalProducts(),
        fetchNewestProducts(3) // Pega os 3 mais novos
    ]);

    if (promoResponse.data) {
        renderPromotionalProducts(promoListEl, promoResponse.data);
    }
    if (newArrivalsResponse.data) {
        // Reutilizamos a função renderProducts para os recém-chegados
        renderProducts(newListEl, newArrivalsResponse.data);
    }
}
    // Página de Login
    else if (path.includes('login.html')) {
        // A função setupAuthEventListeners já é chamada na inicialização
    } 
    // Página de Detalhes do Produto
    else if (path.includes('produto.html')) {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');
        if (productId) {
            const containerEl = document.getElementById('product-detail-content');
            const { data, error } = await fetchProductById(productId);
            if (data) {
                renderProductDetails(containerEl, data);
                setupTradeInListener(data); // Adiciona a lógica do botão de troca
            }
        }
    } 
    // Página do Carrinho
    else if (path.includes('carrinho.html')) {
    const listEl = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total');
    
    renderCartPage(listEl, totalEl, { fetchProductsByIds, fetchAdsByIds }); 
    
    setupCartEventListeners(listEl);
    setupSummaryEventListeners();
    // setupCheckoutListener(); // << REMOVA ESTA LINHA
}
 
    // Página Meus Pedidos
    else if (path.includes('meus-pedidos.html')) {
        const session = await handleUserSession();
        if (session) {
            const containerEl = document.getElementById('orders-list-container');
            const { data, error } = await fetchUserOrders(session.user.id);
            if (data) renderOrders(containerEl, data);
        } else {
            window.location.href = 'login.html';
        }
    }
    // Página do Marketplace
    else if (path.includes('marketplace.html')) {
        const adsListEl = document.getElementById('ads-list');
        const { data, error } = await fetchAllUserAds();
        if (data) renderUserAds(adsListEl, data);
        setupSearchAndFilters('marketplace');
    }
    // Página Meus Anúncios
    else if (path.includes('meus-anuncios.html')) {
        const session = await handleUserSession();
        if (session) {
            const adsListEl = document.getElementById('my-ads-list');
            const { data, error } = await fetchMyAds(session.user.id);
            if (data) renderMyAds(adsListEl, data);
        } else {
            window.location.href = 'login.html';
        }
    }
    // Página Criar Anúncio
    else if (path.includes('criar-anuncio.html')) {
        const session = await handleUserSession();
        if (session) {
            setupCreateAdFormListener(session.user.id);
        } else {
            window.location.href = 'login.html';
        }
    }

    // Página de Detalhes do Anúncio
    else if (path.includes('anuncio.html')) {
        const params = new URLSearchParams(window.location.search);
        const adId = params.get('id');
        if (adId) {
            const containerEl = document.getElementById('ad-detail-content');
            const { data, error } = await fetchAdById(adId);
            if (data) renderAdDetails(containerEl, data);
        }
    }

    else if (path.includes('perfil.html')) {
    const session = await handleUserSession();
    if (session) {
        const { data: profile, error } = await getProfile(session.user.id);
        if (profile) {
            renderProfilePage(profile, session.user);
            setupProfileFormListener(session.user.id);
        }
    } else {
        window.location.href = 'login.html';
    }

}

// Página de Resultados da Busca
else if (path.includes('busca.html')) {
    const resultsGrid = document.getElementById('search-results-grid');
    const resultsTitle = document.getElementById('search-results-title');

    // 1. Pega os parâmetros da URL
    const params = new URLSearchParams(window.location.search);
    const searchTerm = params.get('q') || '';
    const category = params.get('cat') || 'all';

    // 2. Atualiza o título da página
    if (searchTerm) {
        resultsTitle.textContent = `Resultados para "${searchTerm}"`;
        document.title = `Busca por "${searchTerm}" - LanternFox`;
    } else if (category !== 'all') {
        resultsTitle.textContent = `Mostrando categoria: ${category}`;
        document.title = `Categoria ${category} - LanternFox`;
    }

    // 3. Busca em ambas as tabelas (produtos e anúncios) em paralelo
    resultsGrid.innerHTML = '<p>Buscando...</p>';
    const [productsResponse, adsResponse] = await Promise.all([
        fetchAllProducts(searchTerm, category),
        fetchAllUserAds(searchTerm, category)
    ]);

    const products = productsResponse.data || [];
    const ads = adsResponse.data || [];

    // 4. Combina e renderiza os resultados
if (products.length === 0 && ads.length === 0) {
    resultsGrid.innerHTML = '<p>Nenhum resultado encontrado para sua busca.</p>';
    return;
}

resultsGrid.innerHTML = '';

// Combina todos os resultados em um único array para renderização
const allResults = [];

// Adiciona produtos da loja, marcando-os para a UI saber como renderizar
products.forEach(product => {
    allResults.push({
        type: 'product',
        data: product
    });
});

// Adiciona anúncios do marketplace
ads.forEach(ad => {
    allResults.push({
        type: 'ad',
        data: ad
    });
});

// Renderiza o HTML para cada resultado, usando a lógica correta
const resultsHTML = allResults.map((result, index) => {
    if (result.type === 'product') {
        const product = result.data;
        // Lógica para verificar se é promoção
        if (product.em_promocao) {
            // Reutiliza o HTML dos cards de promoção
            return `
            <a href="produto.html?id=${product.id}" class="product-card-link" style="--i: ${index};">
                <div class="product-card promotion-card">
                    <div class="promotion-badge">OFERTA</div>
                    <img src="${product.imagem_url || 'https://via.placeholder.com/250'}" alt="${product.nome}">
                    <div class="product-card-content">
                        <h3>${product.nome}</h3>
                        <div class="price-container">
                            <p class="original-price">R$ ${Number(product.preco).toFixed(2)}</p>
                            <p class="promotional-price">R$ ${Number(product.preco_promocional).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </a>
            `;
        } else {
            // Reutiliza o HTML dos cards normais
            return `
            <a href="produto.html?id=${product.id}" class="product-card-link" style="--i: ${index};">
                <div class="product-card">
                    <img src="${product.imagem_url || 'https://via.placeholder.com/250'}" alt="${product.nome}">
                    <div class="product-card-content">
                        <h3>${product.nome}</h3>
                        <p class="price">R$ ${Number(product.preco).toFixed(2)}</p>
                    </div>
                </div>
            </a>
            `;
        }
    } else if (result.type === 'ad') {
        const ad = result.data;
        // Reutiliza o HTML dos cards de anúncio
        return `
        <a href="anuncio.html?id=${ad.id}" class="ad-card-link" style="--i: ${index};">
            <div class="ad-card">
                <img src="${ad.imagem_url || 'https://via.placeholder.com/250'}" alt="${ad.titulo}">
                <div class="ad-card-content">
                    <h3>${ad.titulo}</h3>
                    <p class="ad-price">R$ ${Number(ad.preco_sugerido).toFixed(2)}</p>
                    <p class="ad-author">Anunciado por: <strong>${ad.profiles.full_name || 'Usuário'}</strong></p>
                </div>
            </div>
        </a>
        `;
    }
}).join('');

resultsGrid.innerHTML = resultsHTML;
}

else if (path.includes('checkout.html')) {
    const session = await handleUserSession();
    if (!session) {
        // Protege a rota
        window.location.href = 'login.html';
        return;
    }
    renderCheckoutSummary();
    setupPaymentListeners(session.user.id);
}

}

// --- LÓGICA ESPECÍFICA DE PÁGINA ---

// Adiciona listeners para os botões da página do carrinho
function setupCartEventListeners(cartListEl) {
    if (!cartListEl) return;

    cartListEl.addEventListener('click', (event) => {
        const target = event.target;
        const uniqueId = target.dataset.uniqueId;
        let cartChanged = false;

        if (!uniqueId) return;

        if (target.classList.contains('quantity-btn')) {
            const action = target.dataset.action;
            updateItemQuantity(uniqueId, action);
            cartChanged = true;
        }

        if (target.classList.contains('remove-btn')) {
            if (confirm('Tem certeza que deseja remover este item?')) {
                removeItemFromCart(uniqueId);
                cartChanged = true;
            }
        }

        if (cartChanged) {
            const listEl = document.getElementById('cart-items-list');
            const totalEl = document.getElementById('cart-total');
            renderCartPage(listEl, totalEl, { fetchProductsByIds, fetchAdsByIds }, { setupCheckoutListener, setupSummaryEventListeners }); 
        }
    });
}

// Adiciona listener para o botão de finalizar compra
function setupCheckoutListener() {
    const checkoutButton = document.getElementById('checkout-button');
    
    // Remove qualquer listener antigo para evitar múltiplos cliques
    checkoutButton?.replaceWith(checkoutButton.cloneNode(true));
    
    // Pega o novo botão
    const newCheckoutButton = document.getElementById('checkout-button');

    newCheckoutButton?.addEventListener('click', () => {
        const cart = getCart();
        if (cart.items.length === 0) {
            showToast('Seu carrinho está vazio.', 'error');
            return;
        }
        // A ÚNICA RESPONSABILIDADE DESTE BOTÃO É REDIRECIONAR
        window.location.href = 'checkout.html';
    });
}
// Adiciona listener para o formulário de criação de anúncio
function setupCreateAdFormListener(userId) {
    const form = document.getElementById('create-ad-form');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const messageEl = document.getElementById('form-message');
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Publicando...';
        messageEl.textContent = '';

        const adData = {
            titulo: document.getElementById('titulo').value,
            descricao: document.getElementById('descricao').value,
            preco: document.getElementById('preco').value,
        };
        const imageFile = document.getElementById('imagem').files[0];

        try {
            await createAd(userId, adData, imageFile);
            messageEl.textContent = 'Anúncio criado com sucesso!';
            messageEl.style.color = 'green';
            setTimeout(() => {
                window.location.href = 'meus-anuncios.html';
            }, 2000);
        } catch (error) {
            messageEl.textContent = `Erro: ${error.message}`;
            messageEl.style.color = 'red';
            submitButton.disabled = false;
            submitButton.textContent = 'Publicar Anúncio';
        }
    });
}

// Adiciona listener para o botão "Dar item como entrada" e gerencia o modal
async function setupTradeInListener(storeProduct) {
    const tradeInBtn = document.getElementById('trade-in-btn');
    const modal = document.getElementById('trade-in-modal');
    const closeModalBtn = document.querySelector('.modal-close-btn');
    const myAdsContainer = document.getElementById('my-ads-for-trade');

    tradeInBtn?.addEventListener('click', async () => {
        const session = await handleUserSession();
        if (!session) {
            showToast('Você precisa estar logado para usar esta função.');
            return;
        }

        myAdsContainer.innerHTML = '<p>Carregando seus anúncios...</p>';
        modal.style.display = 'flex';
        const { data: myAds } = await fetchMyAds(session.user.id);

        if (myAds && myAds.length > 0) {
            myAdsContainer.innerHTML = myAds.map(ad => `
                <div class="ad-card">
                    <img src="${ad.imagem_url || 'https://via.placeholder.com/250'}" alt="${ad.titulo}">
                    <div class="ad-card-content">
                        <h3>${ad.titulo}</h3>
                        <p class="ad-price">Valor: R$ ${Number(ad.preco_sugerido).toFixed(2)}</p>
                        <button class="select-trade-ad-btn" data-ad-id="${ad.id}" data-ad-price="${ad.preco_sugerido}" data-ad-title="${ad.titulo}">
                            Usar este item
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            myAdsContainer.innerHTML = '<p>Você não tem nenhum anúncio disponível para troca.</p>';
        }
    });

    closeModalBtn?.addEventListener('click', () => modal.style.display = 'none');
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    myAdsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('select-trade-ad-btn')) {
            const adId = e.target.dataset.adId;
            const adPrice = parseFloat(e.target.dataset.adPrice);
            const adTitle = e.target.dataset.adTitle;

            const finalPrice = storeProduct.preco - adPrice;

            if (confirm(`Usar "${adTitle}" como entrada? \n\nPreço Original: R$ ${storeProduct.preco.toFixed(2)} \nSeu item: - R$ ${adPrice.toFixed(2)} \n\nNovo Total: R$ ${finalPrice.toFixed(2)} \n\nVocê será levado ao carrinho para finalizar.`)) {
                const newCart = {
                    items: [{
                        id: storeProduct.id,
                        name: storeProduct.nome, // Usa 'nome' do objeto da API
                        price: storeProduct.preco, // Usa 'preco' do objeto da API
                        quantity: 1,
                        type: 'loja'
                    }],
                    tradeIn: {
                        adId: adId,
                        adTitle: adTitle,
                        discount: adPrice
                    }
                };
                saveCart(newCart);
                window.location.href = 'carrinho.html';
            }
        }
    });
}

function setupSummaryEventListeners() {
    const summaryEl = document.getElementById('cart-summary');
    if (!summaryEl) return;

    // Usamos um listener específico para o card de resumo
    summaryEl.addEventListener('click', (e) => {
        if (e.target.id === 'remove-trade-in-btn') {
            if (confirm('Tem certeza que deseja remover o item de entrada?')) {
                const cart = getCart();
                cart.tradeIn = null;
                saveCart(cart);

                // Re-renderiza a página do carrinho
                const listEl = document.getElementById('cart-items-list');
                const totalEl = document.getElementById('cart-total');
                renderCartPage(listEl, totalEl, { fetchProductsByIds, fetchAdsByIds });
            }
        }
    });
}

function setupSearchAndFilters() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const searchButton = document.getElementById('search-button');

    if (!searchInput || !categoryFilter || !searchButton) return;

    const performSearch = () => {
        const searchTerm = searchInput.value.trim();
        const category = categoryFilter.value;

        // Constrói a URL com os parâmetros de busca
        const queryParams = new URLSearchParams();
        
        if (searchTerm) {
            queryParams.set('q', searchTerm);
        }
        if (category && category !== 'all') {
            queryParams.set('cat', category);
        }

        // Redireciona para a página de busca com os parâmetros
        window.location.href = `busca.html?${queryParams.toString()}`;
    };

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
    // O filtro de categoria agora também redireciona
    categoryFilter.addEventListener('change', performSearch);
}

function setupProfileFormListener(userId) {
    const form = document.getElementById('profile-edit-form');
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageEl = document.getElementById('form-message');
        const submitButton = form.querySelector('button[type="submit"]');

        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';

        // Pega os dados de texto
        const updates = {
            full_name: document.getElementById('profile-name-input').value,
        };

        // Pega o arquivo de imagem
        const avatarFile = document.getElementById('profile-avatar-upload').files[0];

        try {
            // Passa os dados E o arquivo para a função da API
            await updateProfile(userId, updates, avatarFile);
            
            showToast('Perfil atualizado com sucesso!');
            setTimeout(() => location.reload(), 1500);
        } catch (error) {
            showToast('Erro ao atualizar o perfil.', 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar Alterações';
        }
    });
}

function setupCartPageListeners() {
    // Adiciona um único listener ao corpo do documento
    document.body.addEventListener('click', async (event) => {
        const target = event.target;

        // --- Lógica para botões de quantidade e remover item ---
        if (target.closest('.cart-table-row')) {
            const uniqueId = target.dataset.uniqueId;
            if (uniqueId) {
                let cartChanged = false;
                if (target.classList.contains('quantity-btn')) {
                    updateItemQuantity(uniqueId, target.dataset.action);
                    cartChanged = true;
                }
                if (target.classList.contains('remove-btn')) {
                    if (confirm('Tem certeza que deseja remover este item?')) {
                        removeItemFromCart(uniqueId);
                        cartChanged = true;
                    }
                }
                if (cartChanged) {
                    const listEl = document.getElementById('cart-items-list');
                    const totalEl = document.getElementById('cart-total');
                    renderCartPage(listEl, totalEl, { fetchProductsByIds, fetchAdsByIds });
                }
            }
        }

        // --- Lógica para remover item de entrada ---
        if (target.id === 'remove-trade-in-btn') {
            if (confirm('Tem certeza que deseja remover o item de entrada?')) {
                const cart = getCart();
                cart.tradeIn = null;
                saveCart(cart);
                const listEl = document.getElementById('cart-items-list');
                const totalEl = document.getElementById('cart-total');
                renderCartPage(listEl, totalEl, { fetchProductsByIds, fetchAdsByIds });
            }
        }

        // --- Lógica para finalizar compra ---
        if (target.id === 'checkout-button') {
            const messageEl = document.getElementById('checkout-message');
            messageEl.textContent = 'Processando...';
            
            const session = await handleUserSession();
            if (!session) { /* ... (lógica de erro de login) ... */ return; }

            const cart = getCart();
            if (cart.items.length === 0) { /* ... (lógica de carrinho vazio) ... */ return; }

            try {
                target.disabled = true;
                if (cart.tradeIn) {
                    await createTradeProposal(session.user.id, cart.items[0].id, cart.tradeIn.adId);
                    await updateAdStatus(cart.tradeIn.adId, 'trocado');
                }
                const pedido = await createOrder(session.user.id, cart);
                clearCart();
                showToast(`Pedido #${pedido.id} realizado com sucesso!`);
                const listEl = document.getElementById('cart-items-list');
                const totalEl = document.getElementById('cart-total');
                renderCartPage(listEl, totalEl, { fetchProductsByIds, fetchAdsByIds });
            } catch (error) {
                console.error('Erro detalhado no checkout:', error);
                showToast('Ocorreu um erro ao finalizar o pedido.', 'error');
                target.disabled = false;
            }
        }
    });
}

function renderCheckoutSummary() {
    const summaryEl = document.getElementById('checkout-summary');
    if (!summaryEl) return;

    const cart = getCart();
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let total = subtotal;

    let summaryHTML = `
        <h3>Resumo do Pedido</h3>
        <p><span>Subtotal:</span> <strong>R$ ${subtotal.toFixed(2)}</strong></p>
    `;

    if (cart.tradeIn) {
        total -= cart.tradeIn.discount;
        summaryHTML += `
            <p class="trade-in-discount">
                <span>Entrada ("${cart.tradeIn.adTitle}"):</span> 
                <strong>- R$ ${cart.tradeIn.discount.toFixed(2)}</strong>
            </p>
        `;
    }

    summaryHTML += `
        <hr>
        <p class="total"><span>Total a Pagar:</span> <strong>R$ ${total.toFixed(2)}</strong></p>
    `;

    summaryEl.innerHTML = summaryHTML;
}

function setupPaymentListeners(userId) {
    const payWithCardBtn = document.getElementById('pay-with-card-btn');
    const payWithPixBtn = document.getElementById('pay-with-pix-btn');
    const feedbackEl = document.getElementById('payment-feedback');

    const processPayment = async () => {
        feedbackEl.innerHTML = `<p>Processando pagamento...</p>`;
        payWithCardBtn.disabled = true;
        payWithPixBtn.disabled = true;

        try {
            const cart = getCart();
            
            // Se houver uma troca, registra e atualiza
            if (cart.tradeIn) {
                const storeProductId = cart.items[0].id;
                await createTradeProposal(userId, storeProductId, cart.tradeIn.adId);
                await updateAdStatus(cart.tradeIn.adId, 'trocado');
            }

            // Cria o pedido
            await createOrder(userId, cart);
            
            // Limpa o carrinho e redireciona
            clearCart();
            window.location.href = 'pedido-sucesso.html';

        } catch (error) {
            console.error('Erro no checkout:', error);
            feedbackEl.innerHTML = `<p style="color: var(--error-color);">Ocorreu um erro. Tente novamente.</p>`;
            payWithCardBtn.disabled = false;
            payWithPixBtn.disabled = false;
        }
    };

    payWithCardBtn?.addEventListener('click', processPayment);
    payWithPixBtn?.addEventListener('click', processPayment);
}