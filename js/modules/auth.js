import { supabase } from '../config/supabaseClient.js';

export async function handleUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    
    const loginActions = document.getElementById('login-actions');
    const logoutActions = document.getElementById('logout-actions');
    const myOrdersLi = document.getElementById('my-orders-li');
    const myAdsLi = document.getElementById('my-ads-li');
    const profileLink = document.getElementById('profile-link'); // Adiciona a nova variável

    if (session) {
        if(loginActions) loginActions.style.display = 'none';
        if(logoutActions) logoutActions.style.display = 'block';
        if(myOrdersLi) myOrdersLi.style.display = 'list-item';
        if(myAdsLi) myAdsLi.style.display = 'list-item';
        if(profileLink) profileLink.style.display = 'flex'; // Mostra o link
    } else {
        if(loginActions) loginActions.style.display = 'flex';
        if(logoutActions) logoutActions.style.display = 'none';
        if(myOrdersLi) myOrdersLi.style.display = 'none';
        if(myAdsLi) myAdsLi.style.display = 'none';
        if(profileLink) profileLink.style.display = 'none'; // Esconde o link
    }
    
    return session;
}

export function setupAuthEventListeners() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutButton = document.getElementById('logout-button'); // O botão está aqui
    const messageEl = document.getElementById('message');

googleLoginBtn?.addEventListener('click', async () => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // USA A URL ATUAL DO SITE, SEJA LOCAL OU EM PRODUÇÃO
            redirectTo: window.location.origin 
        }
    });
    if (error) {
        console.error('Erro no login com Google:', error);
    }
});

    // Listener para o formulário de login
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { messageEl.textContent = `Erro no login: ${error.message}`; } 
        else { window.location.href = 'index.html'; }
    });

    // Listener para o formulário de registro
    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value; // Pega o nome
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const messageEl = document.getElementById('message');

        // A PARTE MAIS IMPORTANTE:
    // O nome é enviado dentro do objeto 'options.data'
        const { error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
                data: {
                    full_name: name
                }
            }
        });

        if (error) {    
            messageEl.textContent = `Erro no registro: ${error.message}`;
        } else {    
            messageEl.textContent = 'Registro realizado! Verifique seu e-mail para confirmação.';
        }
    });

    // Listener para o botão de logout
    logoutButton?.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    });
}