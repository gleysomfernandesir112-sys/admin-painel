// auth.js
import { auth, signInWithEmailAndPassword } from './firebase-init.js';
import { db, ref, get } from './firebase-init.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('username').value; // Campo agora aceita email
        const password = document.getElementById('password').value;
        
        errorMessage.classList.add('d-none');

        // --- TENTATIVA DE LOGIN COMO ADMIN ---
        if (email === 'admin@fasthub.cloud') {
            try {
                console.log("Attempting admin login with email:", email);
                await signInWithEmailAndPassword(auth, email, password);
                console.log("Admin login successful, redirecting...");
                window.location.href = 'dashboard.html';
                return; // Encerra a função se o login de admin for bem-sucedido
            } catch (error) {
                console.error("Firebase Admin Auth Error:", error);
                let message = 'Credenciais de administrador inválidas.';
                switch (error.code) {
                    case 'auth/invalid-email':
                        message = 'Email inválido.';
                        break;
                    case 'auth/user-not-found':
                        message = 'Usuário não encontrado.';
                        break;
                    case 'auth/wrong-password':
                        message = 'Senha incorreta.';
                        break;
                    case 'auth/too-many-requests':
                        message = 'Muitas tentativas. Tente novamente mais tarde.';
                        break;
                    default:
                        message = `Erro: ${error.message}`;
                }
                errorMessage.textContent = message;
                errorMessage.classList.remove('d-none');
                return;
            }
        }

        // --- TENTATIVA DE LOGIN COMO REVENDEDOR ---
        const safeEmailId = email.replace(/[.#$[\]]/g, '_');
        const resellerRef = ref(db, 'resellers/' + safeEmailId);

        try {
            console.log("Attempting reseller login for email:", email);
            const snapshot = await get(resellerRef);
            if (snapshot.exists()) {
                const resellerData = snapshot.val();
                if (resellerData.password === password) {
                    // Senha correta, login de revendedor bem-sucedido
                    alert('Login de revendedor bem-sucedido!');
                    // Salva a identidade do revendedor para a próxima página
                    sessionStorage.setItem('resellerId', safeEmailId);
                    sessionStorage.setItem('resellerEmail', email);
                    window.location.href = 'reseller-dashboard.html';
                } else {
                    // Revendedor existe, mas a senha está errada
                    errorMessage.textContent = 'Usuário ou senha inválidos.';
                    errorMessage.classList.remove('d-none');
                }
            } else {
                // Nenhum admin ou revendedor encontrado com este email
                errorMessage.textContent = 'Usuário ou senha inválidos.';
                errorMessage.classList.remove('d-none');
            }
        } catch (error) {
            console.error("Erro ao buscar revendedor:", error);
            errorMessage.textContent = 'Ocorreu um erro no sistema. Tente novamente.';
            errorMessage.classList.remove('d-none');
        }
    });
});
