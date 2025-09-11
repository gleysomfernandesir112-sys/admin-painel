// resellers.js
import { auth, onAuthStateChanged, signOut, db, ref, set, get, onValue } from './firebase-init.js';

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');
    const resellersTableBody = document.getElementById('resellers-table-body');
    const createResellerForm = document.getElementById('create-reseller-form');

    // --- Autenticação e Segurança ---
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'index.html';
        }
    });

    logoutButton.addEventListener('click', () => {
        signOut(auth).then(() => {
            localStorage.clear(); // Limpa o localStorage para garantir um logout completo
            window.location.href = 'index.html';
        });
    });

    // --- Gerenciamento de Revendedores ---
    const resellersRef = ref(db, 'resellers');

    // 1. LER E EXIBIR REVENDEDORES
    onValue(resellersRef, (snapshot) => {
        const resellers = snapshot.val();
        resellersTableBody.innerHTML = ''; // Limpa a tabela

        if (resellers) {
            Object.entries(resellers).forEach(([uid, reseller]) => {
                const row = document.createElement('tr');
                const creditsUsed = reseller.credits_used || 0;
                const creditsTotal = reseller.credits_total || 0;

                row.innerHTML = `
                    <td>${reseller.email}</td>
                    <td>${creditsUsed} / ${creditsTotal}</td>
                    <td>${creditsUsed}</td>
                    <td>${new Date(reseller.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-info btn-sm" title="Adicionar Créditos"><i class="bi bi-plus-circle-fill"></i></button>
                        <button class="btn btn-danger btn-sm" title="Excluir"><i class="bi bi-trash-fill"></i></button>
                    </td>
                `;
                resellersTableBody.appendChild(row);
            });
        } else {
            resellersTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum revendedor encontrado.</td></tr>';
        }
    });

    // 2. CRIAR NOVO REVENDEDOR
    createResellerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('reseller-email').value;
        const password = document.getElementById('reseller-password').value;
        const credits = parseInt(document.getElementById('reseller-credits').value, 10);

        // Gera um ID seguro para o revendedor
        const safeEmailId = email.replace(/[.#$[\]]/g, '_');
        const newResellerRef = ref(db, 'resellers/' + safeEmailId);

        get(newResellerRef).then((snapshot) => {
            if (snapshot.exists()) {
                alert('Erro: Já existe um revendedor com este email.');
            } else {
                set(newResellerRef, {
                    email: email,
                    password: password, // ATENÇÃO: A senha está sendo salva em texto plano.
                    credits_total: credits,
                    credits_used: 0,
                    createdAt: new Date().toISOString()
                }).then(() => {
                    alert('Revendedor criado com sucesso!');
                    createResellerForm.reset();
                    const modal = bootstrap.Modal.getInstance(document.getElementById('create-reseller-modal'));
                    modal.hide();
                }).catch((error) => {
                    console.error("Erro ao criar revendedor:", error);
                    alert('Ocorreu um erro ao criar o revendedor.');
                });
            }
        });
    });
});
