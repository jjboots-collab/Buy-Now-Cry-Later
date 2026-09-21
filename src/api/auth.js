//AUTHENTICATION FORM SUBMISSION
import { supabase } from '../js/supabaseClient.js';

export async function authenticateUser(username, password) {
    const response = await supabase
        .from('D1_users')
        .select('role')
        .eq('username', username)
        .eq('password_hash', password)
        .single();

    if (response.error) {
        alert('Authentication failed');
        return;
    }

    const userRole = response.data.role;
    if (userRole === 'administrator') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}