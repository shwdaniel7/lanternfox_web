// Em js/modules/theme.js

const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeIcon = themeToggleBtn?.querySelector('i');
const currentTheme = localStorage.getItem('theme');

// Função para aplicar o tema
function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon?.classList.remove('fa-moon');
        themeIcon?.classList.add('fa-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeIcon?.classList.remove('fa-sun');
        themeIcon?.classList.add('fa-moon');
        localStorage.setItem('theme', 'light');
    }
}

// Função para alternar o tema
function toggleTheme() {
    const isDark = document.documentElement.hasAttribute('data-theme');
    applyTheme(isDark ? 'light' : 'dark');
}

// Função principal de setup
export function setupTheme() {
    if (!themeToggleBtn) return;

    // Aplica o tema salvo ao carregar a página
    if (currentTheme) {
        applyTheme(currentTheme);
    }

    // Adiciona o listener de clique
    themeToggleBtn.addEventListener('click', toggleTheme);
}