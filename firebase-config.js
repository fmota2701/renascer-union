// Configuração do Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuração do Firebase - credenciais do projeto renascer-union
const firebaseConfig = {
  apiKey: "AIzaSyBrSSdQivVO2_NJi-Df_Di8vkz_6V-b0fQ",
  authDomain: "renascer-union.firebaseapp.com",
  projectId: "renascer-union",
  storageBucket: "renascer-union.firebasestorage.app",
  messagingSenderId: "749308427065",
  appId: "1:749308427065:web:5963d17f056a14b5d8c6e8"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);

// Inicializar Auth
export const auth = getAuth(app);

export default app;
