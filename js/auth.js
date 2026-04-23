// js/auth.js
import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loader = document.getElementById('loader');

// Função de Login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (loader) loader.classList.add('active');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // O onAuthStateChanged abaixo cuidará do redirecionamento
        } catch (error) {
            console.error("Erro de Autenticação:", error.code);
            alert("Falha no login: Usuário ou senha inválidos.");
        } finally {
            if (loader) loader.classList.remove('active');
        }
    });
}

// Controle de Sessão e Redirecionamento Automático
onAuthStateChanged(auth, (user) => {
    const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/');
    
    if (user) {
        if (isLoginPage) window.location.href = "dashboard.html";
    } else {
        if (!isLoginPage) window.location.href = "index.html";
    }
});

// Logout (Botão Sair)
const logoutBtn = document.getElementById('logout-button');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = "index.html";
        });
    });
}
