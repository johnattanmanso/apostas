import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCBgsFf6ynDU60_ITWQ1sNtYiCyKyyE83I",
  authDomain: "sistema-apostas-757f2.firebaseapp.com",
  projectId: "sistema-apostas-757f2",
  storageBucket: "sistema-apostas-757f2.appspot.com",
  messagingSenderId: "32782540371",
  appId: "1:32782540371:web:9a870595691aa9c3c5f0a6",
  measurementId: "G-91GW8B889B"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta as instâncias para serem usadas em outros arquivos
export const auth = getAuth(app);
export const db = getFirestore(app);
