// js/auth.js
import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const loginForm = document.getElementById('login-form');
const loader = document.getElementById('loader');

// Função de Login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (loader) loader.classList.add('active');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error("Erro no login:", error.code);
            alert("E-mail ou senha inválidos. Tente novamente.");
        } finally {
            if (loader) loader.classList.remove('active');
        }
    });
}

// Proteção de Rota (Monitor de Sessão)
onAuthStateChanged(auth, (user) => {
    const path = window.location.pathname;
    const isLoginPage = path.includes('index.html') || path.endsWith('/');

    if (user) {
        if (isLoginPage) window.location.href = 'dashboard.html';
    } else {
        if (!isLoginPage) window.location.href = 'index.html';
    }
});
