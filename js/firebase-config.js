// js/firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyCBgsFf6ynDU60_ITWQ1sNtYiCyKyyE83I",
  authDomain: "sistema-apostas-757f2.firebaseapp.com",
  projectId: "sistema-apostas-757f2",
  storageBucket: "sistema-apostas-757f2.appspot.com",
  messagingSenderId: "32782540371",
  appId: "1:32782540371:web:9a870595691aa9c3c5f0a6",
  measurementId: "G-91GW8B889B"
};

let auth = null;
let db = null;

try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  auth = firebase.auth();
  db = firebase.firestore();

  if (window.location.hostname !== 'localhost') {
    console.warn('AVISO: Firebase config exposta em produção!');
  }
} catch (e) {
  console.error("Erro ao inicializar Firebase:", e);
  alert("Erro crítico: Firebase não inicializado.");
}

export { auth, db };