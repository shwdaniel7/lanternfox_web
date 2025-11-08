import { getCart, addToCart } from './cart.js';

// Atualiza o número no ícone do carrinho
export function updateCartCount() {
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) {
        const cart = getCart();
        const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cartCountEl.textContent = totalItems;
    }
}

// Renderiza a grade de produtos na página inicial
export function renderProducts(productListEl, products) {
    if (!productListEl) return;
    productListEl.innerHTML = products.map((product, index) => `
        <a href="produto.html?id=${product.id}" class="product-card-link" style="--i: ${index};">
            <div class="product-card">
                <img src="${product.imagem_url || 'https://via.placeholder.com/250'}" alt="${product.nome}">
                <div class="product-card-content">
                    <h3>${product.nome}</h3>
                    <p class="price">R$ ${Number(product.preco).toFixed(2)}</p>
                </div>
            </div>
        </a>
    `).join('');
}

// Renderiza os detalhes de um único produto da LOJA
export function renderProductDetails(containerEl, product) {
    if (!containerEl) return;
    
    document.title = `${product.nome} - LanternFox`;
    
    // Lógica para determinar o HTML do preço
    const priceHTML = product.em_promocao
        ? `
            <p class="original-price-detail">R$ ${Number(product.preco).toFixed(2)}</p>
            <p class="promotional-price-detail">R$ ${Number(product.preco_promocional).toFixed(2)}</p>
        `
        : `<p class="price-detail">R$ ${Number(product.preco).toFixed(2)}</p>`;

    // Lógica para determinar o HTML dos botões de ação
    const actionsHTML = product.em_promocao
        ? `
            <button id="add-to-cart-detail-btn" class="button">Adicionar ao Carrinho</button>
            <div class="trade-in-disclaimer">
                <button id="trade-in-btn" class="button button-secondary" disabled>Dar item como entrada</button>
                <small>Esta opção não está disponível para produtos em promoção.</small>
            </div>
        `
        : `
            <button id="add-to-cart-detail-btn" class="button">Adicionar ao Carrinho</button>
            <button id="trade-in-btn" class="button button-secondary">Dar item como entrada</button>
        `;

    containerEl.innerHTML = `
        <div class="product-detail-grid">
            <!-- Coluna da Imagem (Esquerda) -->
            <div class="product-detail-image">
                <img src="${product.imagem_url || 'https://via.placeholder.com/400'}" alt="${product.nome}">
            </div>

            <!-- Coluna de Conteúdo (Direita) -->
            <div>
                <div class="product-detail-info">
                    <h1 class="gradient-text">${product.nome}</h1>
                </div>

                <div class="product-purchase-card">
                    ${priceHTML}
                    <p class="stock-info">Em estoque: ${product.estoque} unidades</p>
                    <div class="purchase-actions">
                        ${actionsHTML}
                    </div>
                </div>

                <div class="product-specs">
                    <h3>Sobre o produto</h3>
                    <p>${product.descricao || 'Sem descrição disponível.'}</p>
                </div>
            </div>
        </div>
    `;

    document.getElementById('add-to-cart-detail-btn').addEventListener('click', () => {
        addToCart(product);
    });
}

// Renderiza a página completa do carrinho (com busca de dados)
export async function renderCartPage(listEl, totalEl, apiFetchers) {
    const cart = getCart();
    if (!listEl || !totalEl) return;

    const summaryContent = document.getElementById('cart-summary');

    if (cart.items.length === 0) {
        listEl.innerHTML = '<p>Seu carrinho está vazio.</p>';
        if (summaryContent) summaryContent.style.display = 'none';
        return;
    }

    if (summaryContent) summaryContent.style.display = 'block';

    // 1. Separa os IDs por tipo
    const productIds = cart.items.filter(i => i.type === 'loja').map(i => i.id);
    const adIds = cart.items.filter(i => i.type === 'marketplace').map(i => i.id);

    // 2. Busca os detalhes de cada tipo em paralelo
    const [productsResponse, adsResponse] = await Promise.all([
        productIds.length > 0 ? apiFetchers.fetchProductsByIds(productIds) : Promise.resolve({ data: [] }),
        adIds.length > 0 ? apiFetchers.fetchAdsByIds(adIds) : Promise.resolve({ data: [] })
    ]);

    const products = productsResponse.data || [];
    const ads = adsResponse.data || [];

    // 3. Combina os detalhes com os itens do carrinho
    const cartWithDetails = cart.items.map(item => {
        let details = {};
        if (item.type === 'loja') {
            details = products.find(p => p.id === item.id);
        } else {
            details = ads.find(a => a.id === item.id);
        }
        // Garantir que não sobrescrevemos a URL da imagem com o item do carrinho
        const combinedItem = { ...item, ...details };
        return {
            ...combinedItem,
            nome: combinedItem.name || combinedItem.nome || combinedItem.titulo,
            preco: combinedItem.price,
            imagem_url: details?.imagem_url || 'https://via.placeholder.com/100'
        };
    });

    // 4. Renderiza a lista de itens
    listEl.innerHTML = `
        <div class="cart-table-header">
            <div class="header-item product-col">Produto</div>
            <div class="header-item">Preço</div>
            <div class="header-item">Qtd.</div>
            <div class="header-item">Subtotal</div>
        </div>
        ${cartWithDetails
            .filter(item => item.nome && item.preco)
            .map(item => `
            <div class="cart-table-row">
                <div class="product-col">
                    <img src="${item.imagem_url}" alt="${item.nome}">
                    <div class="product-info">
                        <p><strong>${item.nome}</strong></p>
                        <button class="remove-btn" data-unique-id="${item.uniqueId}">Remover</button>
                    </div>
                </div>
                <div>R$ ${Number(item.preco).toFixed(2)}</div>
                <div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" data-unique-id="${item.uniqueId}" data-action="decrease">&minus;</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" data-unique-id="${item.uniqueId}" data-action="increase">&plus;</button>
                    </div>
                </div>
                <div><strong>R$ ${(item.preco * item.quantity).toFixed(2)}</strong></div>
            </div>
        `).join('')}
    `;

    // 5. Calcula e exibe o resumo do pedido (LÓGICA CORRIGIDA)
    if (summaryContent) {
        const subtotal = cartWithDetails.reduce((sum, item) => sum + (item.preco * item.quantity), 0);
        let total = subtotal;

        // Guarda o título e limpa o conteúdo do resumo
        const title = summaryContent.querySelector('h2').outerHTML;
        summaryContent.innerHTML = title; // Mantém apenas o título

        // Adiciona a linha de subtotal
        summaryContent.innerHTML += `<p>Subtotal: <strong>R$ ${subtotal.toFixed(2)}</strong></p>`;

        // Adiciona a linha de desconto se houver um item de troca
        if (cart.tradeIn) {
            total -= cart.tradeIn.discount;
            summaryContent.innerHTML += `
                <div class="trade-in-discount">
                    <p>Entrada ("${cart.tradeIn.adTitle}"):</p>
                    <strong>- R$ ${cart.tradeIn.discount.toFixed(2)}</strong>
                </div>
                <button id="remove-trade-in-btn" class="remove-btn-small">Remover</button>
            `;
        }

        // Adiciona o total e os botões de volta
        summaryContent.innerHTML += `
            <p id="cart-total-wrapper">Total: <strong id="cart-total">R$ ${total.toFixed(2)}</strong></p>
            <button id="checkout-button" class="button">Finalizar Compra</button>
            <p id="checkout-message" style="margin-top: 15px;"></p>
        `;
    }
    const checkoutButton = document.getElementById('checkout-button');
    checkoutButton?.addEventListener('click', () => {
        window.location.href = 'checkout.html';
    });

}

// Renderiza a lista de pedidos do usuário
// Em js/modules/ui.js
export function renderOrders(containerEl, orders) {
    if (!containerEl) return;

    if (orders.length === 0) {
        containerEl.innerHTML = '<p>Você ainda não fez nenhum pedido.</p>';
        return;
    }

    containerEl.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <h3>Pedido #${order.id}</h3>
                    <p class="order-date">Realizado em: ${new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div class="order-total">
                    <span>Total do Pedido</span>
                    <strong>R$ ${Number(order.valor_total).toFixed(2)}</strong>
                </div>
            </div>
            
            <div class="order-items-list">
                <div class="cart-table-header" style="padding-left: 0; padding-right: 0;">
                    <div class="header-item product-col">Produto</div>
                    <div class="header-item">Preço</div>
                    <div class="header-item">Qtd.</div>
                    <div class="header-item">Subtotal</div>
                </div>
                ${order.itens_pedido.map(item => {
                    const isFromStore = item.produtos_loja !== null;
                    const details = isFromStore ? item.produtos_loja : item.anuncios_usuarios;

                    // Se o produto/anúncio foi deletado, 'details' será null.
                    // Precisamos tratar esse caso para não quebrar a página.
                    if (!details) {
                        return `
                        <div class="cart-table-row" style="padding-left: 0; padding-right: 0;">
                            <div class="product-col">
                                <img src="https://via.placeholder.com/100" alt="Item indisponível">
                                <div class="product-info">
                                    <p><strong>Item não mais disponível</strong></p>
                                </div>
                            </div>
                            <div>-</div>
                            <div style="text-align: center;">${item.quantidade}</div>
                            <div>-</div>
                        </div>
                        `;
                    }
                    
                    const name = isFromStore ? details.nome : details.titulo;
                    
                    return `
                    <div class="cart-table-row" style="padding-left: 0; padding-right: 0;">
                        <div class="product-col">
                            <img src="${details.imagem_url || 'https://via.placeholder.com/100'}" alt="${name}">
                            <div class="product-info">
                                <p><strong>${name}</strong></p>
                            </div>
                        </div>
                        <div>R$ ${Number(item.preco_unitario).toFixed(2)}</div>
                        <div style="text-align: center;">${item.quantidade}</div>
                        <div><strong>R$ ${(item.quantidade * item.preco_unitario).toFixed(2)}</strong></div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
    `).join('');
}

export function renderUserAds(adsListEl, ads) {
    if (!adsListEl) return;

    // Primeiro limpa o conteúdo anterior e mostra mensagem de carregamento
    adsListEl.innerHTML = "<p>Carregando anúncios...</p>";

    // Verifica se ads é undefined ou null
    if (!ads) {
        adsListEl.innerHTML = "<p>Erro ao carregar os anúncios. Tente recarregar a página.</p>";
        return;
    }

    // Verifica se não há anúncios
    if (ads.length === 0) {
        adsListEl.innerHTML = "<p>Nenhum anúncio encontrado no momento.</p>";
        return;
    }

    // Renderiza os anúncios
    try {
        adsListEl.innerHTML = ads.map((ad, index) => `
            <a href="anuncio.html?id=${ad.id}" class="ad-card-link" style="--i: ${index};">
                <div class="ad-card">
                    <img src="${ad.imagem_url || 'https://via.placeholder.com/250'}" alt="${ad.titulo}">
                    <div class="ad-card-content">
                        <h3>${ad.titulo}</h3>
                        <p class="ad-price">R$ ${Number(ad.preco_sugerido).toFixed(2)}</p>
                        <p class="ad-author">Anunciado por: <strong>${ad.profiles?.full_name || 'Usuário'}</strong></p>
                    </div>
                </div>
            </a>
        `).join('');
    } catch (error) {
        console.error('Erro ao renderizar anúncios:', error);
        adsListEl.innerHTML = "<p>Erro ao exibir os anúncios. Tente recarregar a página.</p>";
    }
}

export function renderMyAds(adsListEl, ads) {
    if (!adsListEl) return;

    if (ads.length === 0) {
        adsListEl.innerHTML = "<p>Você ainda não criou nenhum anúncio.</p>";
        return;
    }

    adsListEl.innerHTML = ads.map(ad => `
        <div class="ad-card">
            <img src="${ad.imagem_url || 'https://via.placeholder.com/250'}" alt="${ad.titulo}">
            <div class="ad-card-content">
                <h3>${ad.titulo}</h3>
                <p class="ad-price">R$ ${Number(ad.preco_sugerido).toFixed(2)}</p>
                <p class="ad-status">Status: <strong>${ad.status}</strong></p>
                <div class="ad-actions">
                    <button class="edit-btn" data-id="${ad.id}">Editar</button>
                    <button class="delete-btn" data-id="${ad.id}">Excluir</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Renderiza os detalhes de um único ANÚNCIO do marketplace
export function renderAdDetails(containerEl, ad) {
    if (!containerEl) return;
    
    document.title = `${ad.titulo} - LanternFox Marketplace`;
    
    containerEl.innerHTML = `
        <div class="product-detail-grid">
            <div class="product-detail-image">
                <img src="${ad.imagem_url || 'https://via.placeholder.com/400'}" alt="${ad.titulo}">
            </div>
            <div>
                <div class="product-detail-info">
                    <h1 class="gradient-text">${ad.titulo}</h1>
                </div>
                <div class="product-purchase-card">
                    <p class="price-detail">R$ ${Number(ad.preco_sugerido).toFixed(2)}</p>
                    <p class="stock-info">Vendido por: <strong>${ad.profiles.full_name || 'Usuário'}</strong></p>
                    <div class="purchase-actions">
                        <button id="add-ad-to-cart-btn" class="button">Adicionar ao Carrinho</button>
                    </div>
                </div>
                <div class="product-specs">
                    <h3>Sobre o produto</h3>
                    <p>${ad.descricao || 'Sem descrição disponível.'}</p>
                </div>
            </div>
        </div>
    `;

    // GARANTA QUE ESTE BLOCO ESTEJA USANDO 'ad' e defina o tipo como marketplace
    document.getElementById('add-ad-to-cart-btn').addEventListener('click', () => {
        const adWithType = { ...ad, type: 'marketplace' };
        addToCart(adWithType);
    });
}

export function renderProfilePage(profile, user) {
    // Elementos de visualização
    const avatarImg = document.getElementById('profile-avatar-img');
    const nameDisplay = document.getElementById('profile-name-display');
    const emailDisplay = document.getElementById('profile-email-display');
    
    // Campos do formulário
    const nameInput = document.getElementById('profile-name-input');
    const avatarInput = document.getElementById('profile-avatar-input');

    if (avatarImg) avatarImg.src = profile.avatar_url || 'https://via.placeholder.com/150';
    if (nameDisplay) nameDisplay.textContent = profile.full_name || 'Nome não definido';
    if (emailDisplay) emailDisplay.textContent = user.email;

    if (nameInput) nameInput.value = profile.full_name || '';
    if (avatarInput) avatarInput.value = profile.avatar_url || '';
}

// Renderiza os botões de departamento
export function renderDepartments(containerEl) {
    if (!containerEl) return;

    const departments = [
        { name: 'Placas-Mãe', icon: 'fa-cog' },
        { name: 'Processador', icon: 'fa-microchip' },
        { name: 'Placas de Vídeo', icon: 'fa-desktop' },
        { name: 'Memória RAM', icon: 'fa-memory' },
        { name: 'Fontes', icon: 'fa-plug' },
        { name: 'SSDs', icon: 'fa-hdd' },
        { name: 'Coolers', icon: 'fa-snowflake' },
        { name: 'Periféricos', icon: 'fa-keyboard' },
        { name: 'Notebooks', icon: 'fa-laptop' },
        { name: 'Consoles', icon: 'fa-gamepad' }
    ];


    containerEl.innerHTML = departments.map(dept => `
        <a href="busca.html?cat=${encodeURIComponent(dept.name)}" class="department-card">
            <i class="fas ${dept.icon}"></i>
            <span>${dept.name}</span>
        </a>
    `).join('');
}

export function renderPromotionalProducts(promoListEl, products) {
    if (!promoListEl) return;

    if (products.length === 0) {
        document.getElementById('promotions-section')?.remove();
        return;
    }

    promoListEl.innerHTML = products.map((product, index) => `
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
    `).join('');
}
