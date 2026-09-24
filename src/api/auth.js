//AUTHENTICATION FORM SUBMISSION
// src/api/auth.js
import { supabase } from '../js/supabaseClient.js';

export async function authenticateUser(username, password) {
    const { data, error } = await supabase
        .from('D1_users')
        .select('role')
        .eq('username', username)
        .eq('password_hash', password)
        .single();

    if (error) {
        console.error('Database query error:', error);
        alert('Authentication failed: Invalid credentials or user not found');
        return;
    }

    if (data && data.role === 'administrator') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}