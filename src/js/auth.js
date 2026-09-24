// AUTHENTICATION FORM EVENT LISTENER
import { authenticateUser } from '../api/auth.js';

const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        // Prevent default browser form POST navigation
        event.preventDefault();

        const usernameInput = document.getElementById('username').value;
        const passwordInput = document.getElementById('password').value;

        await authenticateUser(usernameInput, passwordInput);
    });
}