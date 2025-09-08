// reseller-dashboard.js
import { auth, signOut, db, ref, set, get, onValue, update, remove } from './firebase-init.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const logoutButton = document.getElementById('logout-button');
    const usersTableBody = document.getElementById('users-table-body');
    const totalUsersCount = document.getElementById('total-users-count');
    const creditsRemainingEl = document.getElementById('credits-remaining');
    const createUserForm = document.getElementById('create-user-form');
    const resetPasswordForm = document.getElementById('reset-password-form');
    const createUserBtn = document.getElementById('create-user-btn');

    // Modais
    const createUserModal = new bootstrap.Modal(document.getElementById('create-user-modal'));
    const resetPasswordModal = new bootstrap.Modal(document.getElementById('reset-password-modal'));

    // --- Identificação e Segurança ---
    const resellerId = sessionStorage.getItem('resellerId');
    if (!resellerId) {
        alert('Acesso negado. Faça o login como revendedor.');
        window.location.href = 'index.html';
        return;
    }

    // --- Referências do Firebase ---
    const resellerRef = ref(db, 'resellers/' + resellerId);
    const usersRef = ref(db, 'users');
    let creditsRemaining = 0;

    // --- Logout ---
    logoutButton.addEventListener('click', async () => {
        await signOut(auth);
        localStorage.clear();
        window.location.href = 'index.html';
    });

    // --- Funções de Ação ---
    window.handleResellerAction = async (action, userId) => {
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
            if (!confirm(`Tem certeza que deseja excluir o usuário ${userId}? 1 crédito será devolvido.`)) return;
            
            await remove(userRef);

            // Devolve o crédito ao revendedor
            const currentUsedCredits = (await get(ref(db, `resellers/${resellerId}/credits_used`))).val() || 0;
            await update(resellerRef, { credits_used: Math.max(0, currentUsedCredits - 1) });
            
            alert('Usuário excluído e crédito devolvido!');
        }
    };

    // --- Carregar Dados e Renderizar Tabela ---
    onValue(resellerRef, (snapshot) => {
        const resellerData = snapshot.val();
        if (resellerData) {
            const usedCredits = resellerData.credits_used || 0;
            const totalCredits = resellerData.credits_total || 0;
            creditsRemaining = totalCredits - usedCredits;
            creditsRemainingEl.textContent = creditsRemaining;

            createUserBtn.disabled = creditsRemaining <= 0;
            createUserBtn.title = creditsRemaining <= 0 ? "Créditos insuficientes" : "";
        }
    });

    onValue(usersRef, (snapshot) => {
        const allUsers = snapshot.val();
        usersTableBody.innerHTML = '';
        let userCount = 0;

        if (allUsers) {
            Object.entries(allUsers).forEach(([uid, user]) => {
                if (user.createdBy === resellerId) {
                    userCount++;
                    const row = document.createElement('tr');
                    const statusBadge = user.status === 'active' ? `<span class="badge bg-success">Ativo</span>` : `<span class="badge bg-danger">Bloqueado</span>`;
                    row.innerHTML = `
                        <td>${user.username}</td>
                        <td>${statusBadge}</td>
                        <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-warning btn-sm" onclick="handleResellerAction('resetPassword', '${uid}')"><i class="bi bi-key-fill"></i></button>
                            <button class="btn btn-secondary btn-sm" onclick="handleResellerAction('toggleBlock', '${uid}')"><i class="bi bi-slash-circle-fill"></i></button>
                            <button class="btn btn-danger btn-sm" onclick="handleResellerAction('delete', '${uid}')"><i class="bi bi-trash-fill"></i></button>
                        </td>
                    `;
                    usersTableBody.appendChild(row);
                }
            });
        }
        totalUsersCount.textContent = userCount;
        if (userCount === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Você ainda não criou nenhum usuário.</td></tr>';
        }
    });
    
    // --- Formulários ---
    createUserBtn.addEventListener('click', () => createUserModal.show());

    createUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (creditsRemaining <= 0) {
            alert('Você não tem créditos suficientes.');
            return;
        }

        const username = document.getElementById('new-username').value;
        const password = document.getElementById('new-password').value;
        const newUserRef = ref(db, 'users/' + username);

        if ((await get(newUserRef)).exists()) {
            alert('Erro: Este nome de usuário já existe.');
            return;
        }

        await set(newUserRef, {
            username, password,
            status: 'active',
            createdAt: new Date().toISOString(),
            createdBy: resellerId
        });

        const currentUsedCredits = (await get(ref(db, `resellers/${resellerId}/credits_used`))).val() || 0;
        await update(resellerRef, { credits_used: currentUsedCredits + 1 });

        alert('Usuário criado com sucesso! 1 crédito foi utilizado.');
        createUserForm.reset();
        createUserModal.hide();
    });

    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = document.getElementById('reset-username-input').value;
        const newPassword = document.getElementById('new-user-password').value;
        await update(ref(db, `users/${userId}`), { password: newPassword });
        
        alert('Senha atualizada com sucesso!');
        resetPasswordForm.reset();
        resetPasswordModal.hide();
    });
});