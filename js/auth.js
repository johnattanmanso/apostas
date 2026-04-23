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

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value;
        const password = passwordInput.value;

        if (loader) loader.classList.add('active');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = "dashboard.html";
        } catch (error) {
            console.error("Erro:", error.code);
            alert("Falha no login: Verifique e-mail e senha.");
        } finally {
            if (loader) loader.classList.remove('active');
        }
    });
}

// Proteção de rota
onAuthStateChanged(auth, (user) => {
    const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname === '/';
    if (user && isLoginPage) {
        window.location.href = "dashboard.html";
    } else if (!user && !isLoginPage) {
        window.location.href = "index.html";
    }
});
