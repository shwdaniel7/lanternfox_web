export function setupScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-indicator-bar');
    if (!scrollIndicator) return;

    window.addEventListener('scroll', () => {
        const scrollTop = document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (scrollTop / scrollHeight) * 100;

        scrollIndicator.style.width = `${scrolled}%`;
    });
}