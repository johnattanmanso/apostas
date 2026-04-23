import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const loginForm = document.getElementById('login-form');
const loader = document.getElementById('loader');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (loader) loader.classList.add('active');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error("Erro no login:", error.code);
            alert("Usuário ou senha inválidos.");
        } finally {
            if (loader) loader.classList.remove('active');
        }
    });
}

// Proteção de Rotas
onAuthStateChanged(auth, (user) => {
    const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/');
    if (user && isLoginPage) {
        window.location.href = 'dashboard.html';
    } else if (!user && !isLoginPage) {
        window.location.href = 'index.html';
    }
});
