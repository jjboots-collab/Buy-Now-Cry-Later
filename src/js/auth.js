//AUTHENTICATION
import { authenticateUser } from '../api/auth.js';

function handleLogin(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    authenticateUser(usernameInput, passwordInput);
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}