// authentication in supabase
import { supabase } from './supabaseClient.js';

async function handleLogin(event) {
    event.preventDefault();
    
    const emailInput = document.getElementById('username').value; // Supabase defaults to email for login
    const passwordInput = document.getElementById('password').value;

    // Direct Supabase Auth call using your anon key
    const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput,
        password: passwordInput,
    });

    if (error) {
        console.error('Login error:', error.message);
        alert(`Login failed: ${error.message}`);
        return;
    }

    console.log('Logged in successfully:', data);
    // Redirect user to dashboard upon success
    window.location.href = 'dashboard.html';
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}