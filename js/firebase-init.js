// firebase-init.js
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, set, get, onValue, remove, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCY9sq12w7H9X3hm9FLa_KkazKONpm1nJE",
  authDomain: "fasthub-9a206.firebaseapp.com",
  databaseURL: "https://fasthub-9a206-default-rtdb.firebaseio.com",
  projectId: "fasthub-9a206",
  storageBucket: "fasthub-9a206.appspot.com",
  messagingSenderId: "685686875831",
  appId: "1:685686875831:web:a31c42df4b9f6bd7b88f32"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Exporta as funções que serão usadas em outros scripts
export { initializeApp, deleteApp, auth, getAuth, onAuthStateChanged, signOut, db, ref, set, get, onValue, remove, update, signInWithEmailAndPassword, createUserWithEmailAndPassword };