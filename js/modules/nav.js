export function setupMobileNav() {
    const navToggle = document.querySelector('.mobile-nav-toggle');
    const primaryNav = document.getElementById('primary-navigation');

    if (!navToggle || !primaryNav) return;

    navToggle.addEventListener('click', () => {
        const isVisible = primaryNav.getAttribute('data-visible') === 'true';
        
        if (isVisible) {
            primaryNav.setAttribute('data-visible', 'false');
            navToggle.setAttribute('aria-expanded', 'false');
        } else {
            primaryNav.setAttribute('data-visible', 'true');
            navToggle.setAttribute('aria-expanded', 'true');
        }
    });
}