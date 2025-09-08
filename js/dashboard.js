// dashboard.js
import { auth, onAuthStateChanged, signOut, db, ref, set, get, onValue, remove, update } from './firebase-init.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const logoutButton = document.getElementById('logout-button');
    const usersTableBody = document.getElementById('users-table-body');
    const totalUsersCount = document.getElementById('total-users-count');
    const createUserForm = document.getElementById('create-user-form');
    const resetPasswordForm = document.getElementById('reset-password-form');
    
    // Modais
    const createUserModal = new bootstrap.Modal(document.getElementById('create-user-modal'));
    const resetPasswordModal = new bootstrap.Modal(document.getElementById('reset-password-modal'));

    // --- Autenticação ---
    onAuthStateChanged(auth, (user) => {
        if (!user) window.location.href = 'index.html';
    });

    logoutButton.addEventListener('click', () => {
        signOut(auth).then(() => {
            localStorage.clear(); // Limpa o localStorage para garantir um logout completo
            window.location.href = 'index.html';
        });
    });

    // --- Referências do Firebase ---
    const usersRef = ref(db, 'users');

    // --- Funções de Ação ---
    window.handleAction = async (action, userId, createdBy) => {
        const userRef = ref(db, `users/${userId}`);

        if (action === 'toggleBlock') {
            const snapshot = await get(userRef);
            const newStatus = snapshot.val().status === 'active' ? 'blocked' : 'active';
            await update(userRef, { status: newStatus });
            alert(`Usuário ${newStatus === 'active' ? 'desbloqueado' : 'bloqueado'}.`);
        }

        if (action === 'resetPassword') {
            document.getElementById('reset-username-display').textContent = userId;
            document.getElementById('reset-username-input').value = userId;
            resetPasswordModal.show();
        }

        if (action === 'delete') {
            if (!confirm(`Tem certeza que deseja excluir o usuário ${userId}? Esta ação não pode ser desfeita.`)) return;

            await remove(userRef);

            // Se o usuário foi criado por um revendedor, devolve o crédito
            if (createdBy && createdBy !== 'admin') {
                const resellerRef = ref(db, `resellers/${createdBy}`);
                const resellerSnapshot = await get(resellerRef);
                if (resellerSnapshot.exists()) {
                    const currentUsedCredits = resellerSnapshot.val().credits_used || 0;
                    await update(resellerRef, { credits_used: Math.max(0, currentUsedCredits - 1) });
                }
            }
            alert('Usuário excluído com sucesso!');
        }
    };

    // --- Renderização da Tabela ---
    onValue(usersRef, (snapshot) => {
        const users = snapshot.val();
        usersTableBody.innerHTML = '';

        if (users) {
            totalUsersCount.textContent = Object.keys(users).length;
            Object.entries(users).forEach(([uid, user]) => {
                const row = document.createElement('tr');
                const statusBadge = user.status === 'active' ? `<span class="badge bg-success">Ativo</span>` : `<span class="badge bg-danger">Bloqueado</span>`;
                const createdByDisplay = user.createdBy ? user.createdBy.replace(/_/g, '.') : 'Admin';
                
                row.innerHTML = `
                    <td>${user.username}</td>
                    <td>${createdByDisplay}</td>
                    <td>${statusBadge}</td>
                    <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="handleAction('resetPassword', '${uid}')" title="Resetar Senha"><i class="bi bi-key-fill"></i></button>
                        <button class="btn btn-secondary btn-sm" onclick="handleAction('toggleBlock', '${uid}')" title="Bloquear/Desbloquear"><i class="bi bi-slash-circle-fill"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="handleAction('delete', '${uid}', '${user.createdBy}')" title="Excluir"><i class="bi bi-trash-fill"></i></button>
                    </td>
                `;
                usersTableBody.appendChild(row);
            });
        } else {
            totalUsersCount.textContent = 0;
            usersTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum usuário encontrado.</td></tr>';
        }
    });

    // --- Formulários ---
    createUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('new-username').value;
        const password = document.getElementById('new-password').value;
        const newUserRef = ref(db, 'users/' + username);

        const snapshot = await get(newUserRef);
        if (snapshot.exists()) {
            alert('Erro: Este nome de usuário já existe.');
            return;
        }

        await set(newUserRef, {
            username, password,
            status: 'active',
            createdAt: new Date().toISOString(),
            createdBy: 'admin' // Usuários criados pelo admin são marcados como 'admin'
        });

        alert('Usuário criado com sucesso!');
        createUserForm.reset();
        createUserModal.hide();
    });

    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = document.getElementById('reset-username-input').value;
        const newPassword = document.getElementById('new-user-password').value;
        const userRef = ref(db, `users/${userId}`);

        await update(userRef, { password: newPassword });
        
        alert('Senha atualizada com sucesso!');
        resetPasswordForm.reset();
        resetPasswordModal.hide();
    });
});