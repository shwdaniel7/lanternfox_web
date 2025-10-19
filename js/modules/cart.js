// Funções puras de gerenciamento do carrinho

import { showToast } from './toast.js';

export function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || { items: [], tradeIn: null };
}

export function saveCart(cartObject) {
    localStorage.setItem('cart', JSON.stringify(cartObject));
    window.dispatchEvent(new CustomEvent('cartUpdated'));
}

export function addToCart(itemDetails) {
    const cart = getCart();
    const itemType = itemDetails.type || 'loja';
    const uniqueId = `${itemType}-${itemDetails.id}`;

    const existingItem = cart.items.find(item => item.uniqueId === uniqueId);

    const priceToAdd = itemDetails.em_promocao ? itemDetails.preco_promocional : (itemDetails.price || itemDetails.preco || itemDetails.preco_sugerido);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.items.push({
            uniqueId: uniqueId,
            id: itemDetails.id,
            name: itemDetails.name || itemDetails.nome || itemDetails.titulo,
            price: priceToAdd, // Salva o preço correto (promocional ou normal)
            quantity: 1,
            type: itemType
        });
    }
    
    saveCart(cart);
    showToast(`${itemDetails.name || itemDetails.nome || itemDetails.titulo} adicionado ao carrinho!`);
}

export function updateItemQuantity(uniqueId, action) {
    const cart = getCart();
    const product = cart.items.find(item => item.uniqueId === uniqueId);

    if (!product) return;

    if (action === 'increase') {
        product.quantity++;
    } else if (action === 'decrease') {
        product.quantity--;
    }

    if (product.quantity <= 0) {
        cart.items = cart.items.filter(item => item.id !== productId);
    }
    
    saveCart(cart);
}

export function removeItemFromCart(uniqueId) {
    const cart = getCart();
    cart.items = cart.items.filter(item => item.uniqueId !== uniqueId);
    saveCart(cart);
}

export function clearCart() {
    saveCart({ items: [], tradeIn: null });
}