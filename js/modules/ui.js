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
                    <div class="shipping-calculator-section">
                        <h4>Calcular Frete</h4>
                        <div class="shipping-input">
                            <input type="text" id="shipping-cep" placeholder="Digite seu CEP" maxlength="9" class="shipping-cep-input">
                            <button id="calculate-shipping" class="button button-secondary">Calcular</button>
                        </div>
                        <div id="shipping-result" class="shipping-result"></div>
                        <small><a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener">Não sei meu CEP</a></small>
                    </div>
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

    const addToCartBtn = document.getElementById('add-to-cart-detail-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            addToCart(product);
        });
    }

    // Inicializa a calculadora de frete
    const calculateBtn = document.getElementById('calculate-shipping');
    const cepInput = document.getElementById('shipping-cep');
    const resultDiv = document.getElementById('shipping-result');

    if (calculateBtn && cepInput && resultDiv) {
        console.log('Inicializando calculadora de frete...');

        // Formata o CEP enquanto digita
        cepInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 5) {
                value = value.replace(/^(\d{5})(\d{0,3}).*/, '$1-$2');
            }
            e.target.value = value;
        });

        // Calcula o frete quando clicar no botão
        calculateBtn.addEventListener('click', async () => {
            console.log('Calculando frete...');
            const cep = cepInput.value.replace(/\D/g, '');
            
            if (cep.length !== 8) {
                resultDiv.innerHTML = '<p class="error-message">CEP inválido. Digite um CEP válido.</p>';
                resultDiv.style.display = 'block';
                return;
            }

            try {
                calculateBtn.disabled = true;
                calculateBtn.textContent = 'Calculando...';
                resultDiv.innerHTML = '<p class="loading-message">Calculando frete...</p>';
                resultDiv.style.display = 'block';
                
                // Busca o endereço primeiro
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();
                
                if (data.erro) {
                    throw new Error('CEP não encontrado');
                }

                // Simula o cálculo do frete (1% do valor do produto + valor base + distância)
                const price = product.em_promocao ? product.preco_promocional : product.preco;
                const baseShipping = Math.max(15, price * 0.01); // Mínimo de R$ 15,00
                const region = cep.substring(0, 2);
                const multiplier = region === '01' ? 1.0 : // São Paulo
                                 region === '20' ? 1.2 : // Rio de Janeiro
                                 region === '30' ? 1.3 : // Minas Gerais
                                 1.5; // Outros estados
                const shippingCost = baseShipping * multiplier;
                const days = Math.round(3 + (multiplier * 2));

                // Mostra o resultado
                resultDiv.innerHTML = `
                    <div class="shipping-option">
                        <div class="shipping-info">
                            <div class="service-name">PAC</div>
                            <div class="delivery-time">Entrega em até ${days} dias úteis</div>
                            <div class="delivery-address">
                                ${data.logradouro ? `${data.logradouro}, ` : ''}
                                ${data.bairro ? `${data.bairro}, ` : ''}
                                ${data.localidade} - ${data.uf}
                            </div>
                        </div>
                        <div class="shipping-price">R$ ${shippingCost.toFixed(2)}</div>
                    </div>
                `;

                // Salva o endereço para usar no checkout
                const shippingData = {
                    cep: data.cep,
                    street: data.logradouro,
                    neighborhood: data.bairro,
                    city: data.localidade,
                    state: data.uf,
                    shipping: {
                        cost: shippingCost,
                        days: days,
                        service: 'PAC',
                        address: {
                            street: data.logradouro,
                            city: data.localidade,
                            state: data.uf
                        }
                    }
                };
                localStorage.setItem('shippingAddress', JSON.stringify(shippingData));

            } catch (error) {
                resultDiv.innerHTML = `<p style="color: var(--error-color);">${error.message || 'Erro ao calcular o frete.'}</p>`;
                resultDiv.style.display = 'block';
            } finally {
                calculateBtn.disabled = false;
                calculateBtn.textContent = 'Calcular';
            }
        });

        // Permite calcular apertando Enter
        cepInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                calculateBtn.click();
            }
        });
    }
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

        // Adiciona a linha de frete se houver endereço salvo
        const savedAddress = localStorage.getItem('shippingAddress');
        if (savedAddress) {
            try {
                const address = JSON.parse(savedAddress);
                if (address.shipping && address.shipping.cost) {
                    total += address.shipping.cost;
                    summaryContent.innerHTML += `
                        <div class="shipping-info">
                            <p>Frete (${address.shipping.service}):</p>
                            <strong>+ R$ ${address.shipping.cost.toFixed(2)}</strong>
                            <small>Entrega em até ${address.shipping.days} dias úteis</small>
                            <br>
                            <small>Para: ${address.street}, ${address.city}/${address.state}</small>
                        </div>
                    `;
                }
            } catch (e) {
                console.error('Erro ao processar endereço salvo:', e);
            }
        }

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

    if (!orders || orders.length === 0) {
        containerEl.innerHTML = '<p>Você ainda não fez nenhum pedido.</p>';
        return;
    }

    console.log('Renderizando pedidos:', orders);

    // Função auxiliar para formatar valores monetários
    const formatMoney = (value) => Number(value).toFixed(2);

    const renderOrderItem = (item) => {
        const isFromStore = item.produtos_loja !== null;
        const details = isFromStore ? item.produtos_loja : item.anuncios_usuarios;

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
            </div>`;
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
            <div>R$ ${formatMoney(item.preco_unitario)}</div>
            <div style="text-align: center;">${item.quantidade}</div>
            <div><strong>R$ ${formatMoney(item.quantidade * item.preco_unitario)}</strong></div>
        </div>`;
    };

    containerEl.innerHTML = orders.map(order => {
        // Calcula o subtotal dos itens
        const subtotal = order.itens_pedido.reduce((sum, item) => 
            sum + (item.quantidade * item.preco_unitario), 0
        );

        // Tenta extrair metadata
        let metadata = {};
        try {
            if (order.metadata) {
                metadata = JSON.parse(order.metadata);
                console.log('Metadata do pedido:', metadata);
            } else {
                console.log('Pedido sem metadata');
            }
        } catch (e) {
            console.error('Erro ao parsear metadata do pedido:', e);
        }

        // Calcula o total incluindo frete e descontos
        const shippingCost = metadata.shippingOption ? metadata.shippingOption.price : 0;
        const tradeInDiscount = metadata.tradeInDiscount || 0;
        const totalWithShipping = subtotal + shippingCost - tradeInDiscount;

        return `
        <div class="order-card">
            <div class="order-header">
                <div class="order-header-info">
                    <h3>Pedido #${order.id}</h3>
                    <p class="order-date">Realizado em: ${new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div class="order-summary">
                    <div class="order-summary-item">
                        <p class="subtotal">
                            <span>Subtotal dos Produtos:</span>
                            <strong>R$ ${formatMoney(subtotal)}</strong>
                        </p>
                    </div>
                    ${metadata.shippingOption ? `
                        <div class="order-summary-item shipping-info">
                            <p>
                                <span>Frete (${metadata.shippingOption.name}):</span>
                                <strong>+ R$ ${formatMoney(metadata.shippingOption.price)}</strong>
                            </p>
                            <div class="shipping-details">
                                <small>Entrega em até ${metadata.shippingOption.days || '15'} dias úteis</small>
                                ${metadata.shippingAddress ? `
                                    <small class="shipping-address">
                                        Para: ${metadata.shippingAddress.street}, ${metadata.shippingAddress.number}
                                        ${metadata.shippingAddress.city}/${metadata.shippingAddress.state}
                                    </small>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                    ${metadata.tradeInDiscount ? `
                        <p class="trade-in-info">
                            <span>Desconto Trade-in:</span>
                            <strong>- R$ ${formatMoney(metadata.tradeInDiscount)}</strong>
                            ${metadata.tradeInAdTitle ? `
                                <br>
                                <small>Item: ${metadata.tradeInAdTitle}</small>
                            ` : ''}
                        </p>
                    ` : ''}
                    <p class="order-total">
                        <span>Total do Pedido:</span>
                        <strong>R$ ${formatMoney(totalWithShipping)}</strong>
                    </p>
                </div>
            </div>
            
            <div class="order-items-list">
                <div class="cart-table-header" style="padding-left: 0; padding-right: 0;">
                    <div class="header-item product-col">Produto</div>
                    <div class="header-item">Preço</div>
                    <div class="header-item">Qtd.</div>
                    <div class="header-item">Subtotal</div>
                </div>
                ${order.itens_pedido.map(item => renderOrderItem(item)).join('')}
            </div>
        </div>
        `;
    }).join('');
}

export function renderUserAds(adsListEl, ads) {
    console.log('Iniciando renderUserAds', { adsListEl: !!adsListEl, ads: ads });

    if (!adsListEl) {
        console.error('adsListEl não encontrado');
        return;
    }

    // Debug: Verifica o estado atual do elemento
    console.log('Estado do elemento antes da renderização:', {
        display: window.getComputedStyle(adsListEl).display,
        visibility: window.getComputedStyle(adsListEl).visibility,
        opacity: window.getComputedStyle(adsListEl).opacity
    });

    // Primeiro limpa o conteúdo anterior
    adsListEl.textContent = '';  // Usa textContent em vez de innerHTML para limpar

    // Verifica se ads é undefined ou null
    if (!ads) {
        console.error('ads é null ou undefined');
        const errorP = document.createElement('p');
        errorP.textContent = 'Erro ao carregar os anúncios. Tente recarregar a página.';
        adsListEl.appendChild(errorP);
        return;
    }

    // Verifica se não há anúncios
    if (ads.length === 0) {
        console.log('Nenhum anúncio encontrado');
        const emptyP = document.createElement('p');
        emptyP.textContent = 'Nenhum anúncio encontrado no momento.';
        adsListEl.appendChild(emptyP);
        return;
    }

    console.log(`Preparando para renderizar ${ads.length} anúncios`);

    // Aplica o estilo do grid
    adsListEl.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 30px;
        width: 100%;
        justify-content: center;
        align-items: stretch;
    `;

    try {
        // Cria e adiciona os elementos um por um
        ads.forEach((ad, index) => {
            console.log('Renderizando anúncio:', ad.id);

            // Cria os elementos
            const cardLink = document.createElement('a');
            cardLink.href = `anuncio.html?id=${ad.id}`;
            cardLink.style.cssText = `
                text-decoration: none;
                color: inherit;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                display: block;
                width: 100%;
            `;

            // Adiciona evento de hover
            cardLink.addEventListener('mouseenter', () => {
                cardLink.style.transform = 'translateY(-5px)';
                cardLink.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
            });
            cardLink.addEventListener('mouseleave', () => {
                cardLink.style.transform = 'translateY(0)';
                cardLink.style.boxShadow = 'none';
            });

            const card = document.createElement('div');
            const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
            card.style.cssText = `
                border-radius: 8px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                height: 100%;
                background-color: ${isDarkTheme ? 'rgba(30, 30, 30, 0.6)' : 'var(--surface-color)'};
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: 1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'var(--border-color)'};
            `;

            // Imagem
            const img = document.createElement('img');
            img.src = ad.imagem_url || 'https://via.placeholder.com/250';
            img.alt = ad.titulo;
            img.style.cssText = `
                width: 100%;
                height: 200px;
                object-fit: cover;
                display: block;
            `;

            // Conteúdo
            const content = document.createElement('div');
            content.style.cssText = `
                padding: 20px;
                display: flex;
                flex-direction: column;
                flex-grow: 1;
            `;

            const title = document.createElement('h3');
            title.textContent = ad.titulo;
            title.style.cssText = `
                font-size: 1.2em;
                margin-bottom: 10px;
                color: var(--text-color);
            `;

            const price = document.createElement('p');
            price.textContent = `R$ ${Number(ad.preco_sugerido).toFixed(2)}`;
            price.style.cssText = `
                font-size: 1.3em;
                font-weight: 700;
                color: var(--primary-color);
                margin-bottom: 15px;
            `;

            const author = document.createElement('p');
            author.textContent = `Anunciado por: ${ad.profiles?.full_name || 'Usuário'}`;
            author.style.cssText = `
                font-size: 0.9em;
                color: var(--text-secondary-color);
                margin-top: auto;
                padding-top: 10px;
                border-top: 1px solid var(--border-color);
            `;

            // Monta a estrutura
            content.appendChild(title);
            content.appendChild(price);
            content.appendChild(author);
            card.appendChild(img);
            card.appendChild(content);
            cardLink.appendChild(card);
            
            // Adiciona ao container
            adsListEl.appendChild(cardLink);
        });

        console.log('Renderização concluída');
        
        // Debug: Verifica o estado final do elemento
        console.log('Estado do elemento após renderização:', {
            childrenCount: adsListEl.children.length,
            display: window.getComputedStyle(adsListEl).display,
            visibility: window.getComputedStyle(adsListEl).visibility,
            opacity: window.getComputedStyle(adsListEl).opacity
        });

    } catch (error) {
        console.error('Erro ao renderizar anúncios:', error);
        adsListEl.textContent = 'Erro ao exibir os anúncios. Tente recarregar a página.';
    }
}

export function renderMyAds(adsListEl, ads) {
    console.log('Iniciando renderMyAds', { adsListEl: !!adsListEl, ads: ads });

    if (!adsListEl) {
        console.error('adsListEl não encontrado');
        return;
    }

    // Limpa o conteúdo anterior
    adsListEl.textContent = '';

    if (!ads) {
        console.error('ads é null ou undefined');
        const errorP = document.createElement('p');
        errorP.textContent = 'Erro ao carregar os anúncios. Tente recarregar a página.';
        adsListEl.appendChild(errorP);
        return;
    }

    if (ads.length === 0) {
        console.log('Nenhum anúncio encontrado');
        const emptyP = document.createElement('p');
        emptyP.textContent = 'Você ainda não criou nenhum anúncio.';
        adsListEl.appendChild(emptyP);
        return;
    }

    console.log(`Preparando para renderizar ${ads.length} anúncios`);

    // Aplica o estilo do grid
    adsListEl.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 30px;
        width: 100%;
        justify-content: center;
        align-items: stretch;
    `;

    try {
        // Cria e adiciona os elementos um por um
        ads.forEach((ad, index) => {
            console.log('Renderizando anúncio:', ad.id);

            const card = document.createElement('div');
            card.className = 'ad-card';
            const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
            card.style.cssText = `
                border-radius: 8px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                height: 100%;
                background-color: ${isDarkTheme ? 'rgba(30, 30, 30, 0.6)' : 'var(--surface-color)'};
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: 1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'var(--border-color)'};
            `;

            // Imagem
            const img = document.createElement('img');
            img.src = ad.imagem_url || 'https://via.placeholder.com/250';
            img.alt = ad.titulo;
            img.style.cssText = `
                width: 100%;
                height: 200px;
                object-fit: cover;
                display: block;
            `;

            // Conteúdo
            const content = document.createElement('div');
            content.className = 'ad-card-content';
            content.style.cssText = `
                padding: 20px;
                display: flex;
                flex-direction: column;
                flex-grow: 1;
            `;

            const title = document.createElement('h3');
            title.textContent = ad.titulo;
            title.style.cssText = `
                font-size: 1.2em;
                margin-bottom: 10px;
                color: var(--text-color);
            `;

            const price = document.createElement('p');
            price.className = 'ad-price';
            price.textContent = `R$ ${Number(ad.preco_sugerido).toFixed(2)}`;
            price.style.cssText = `
                font-size: 1.3em;
                font-weight: 700;
                color: var(--primary-color);
                margin-bottom: 15px;
            `;

            const status = document.createElement('p');
            status.className = 'ad-status';
            status.style.cssText = `
                margin-bottom: 15px;
                color: var(--text-secondary-color);
            `;
            status.innerHTML = `Status: <strong>${ad.status}</strong>`;

            const actions = document.createElement('div');
            actions.className = 'ad-actions';
            actions.style.cssText = `
                display: flex;
                gap: 10px;
                margin-top: auto;
                padding-top: 10px;
                border-top: 1px solid var(--border-color);
            `;

            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = 'Editar';
            editBtn.dataset.id = ad.id;
            editBtn.style.cssText = `
                flex: 1;
                padding: 8px 12px;
                background-color: var(--primary-color);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9em;
            `;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Excluir';
            deleteBtn.dataset.id = ad.id;
            deleteBtn.style.cssText = `
                flex: 1;
                padding: 8px 12px;
                background-color: var(--error-color);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9em;
            `;

            // Monta a estrutura
            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            content.appendChild(title);
            content.appendChild(price);
            content.appendChild(status);
            content.appendChild(actions);
            card.appendChild(img);
            card.appendChild(content);
            
            // Adiciona ao container
            adsListEl.appendChild(card);
        });

        console.log('Renderização concluída');
        
        // Debug: Verifica o estado final do elemento
        console.log('Estado do elemento após renderização:', {
            childrenCount: adsListEl.children.length,
            display: window.getComputedStyle(adsListEl).display,
            visibility: window.getComputedStyle(adsListEl).visibility,
            opacity: window.getComputedStyle(adsListEl).opacity
        });

    } catch (error) {
        console.error('Erro ao renderizar anúncios:', error);
        adsListEl.textContent = 'Erro ao exibir os anúncios. Tente recarregar a página.';
    }
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