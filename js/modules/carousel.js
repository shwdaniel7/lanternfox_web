// Em js/modules/carousel.js
export function setupCarousel() {
    const container = document.querySelector('.carousel-track-container');
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');

    if (!container || !prevBtn || !nextBtn) return;

    const scrollAmount = container.clientWidth * 0.8; // Rola 80% da largura visível

    nextBtn.addEventListener('click', () => {
        container.scrollLeft += scrollAmount;
    });

    prevBtn.addEventListener('click', () => {
        container.scrollLeft -= scrollAmount;
    });
}