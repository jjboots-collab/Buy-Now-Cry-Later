// Inside initAccountAuth() in app.js

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Stop native HTML form GET submission

        if (!supabase) {
            alert('Database connection not available.');
            return;
        }

        try {
            const fullName = document.getElementById('fullName').value.trim();
            // FIXED: Target regUsername and regPassword
            const username = document.getElementById('regUsername').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('regPassword').value;
            
            const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('username')
                .eq('username', username)
                .maybeSingle();

            if (checkError) throw checkError;

            if (existingUser) {
                alert('Account creation blocked: Username is already taken.');
                return;
            }

            // Create account
            const { error: insertError } = await supabase.from('users').insert([
                {
                    full_name: fullName,
                    username: username,
                    email: email,
                    password_hash: password,
                    role: 'customer',
                    cash_balance: 0.00
                }
            ]);

            if (insertError) {
                alert(`Error creating account: ${insertError.message}`);
            } else {
                alert('Account created successfully! You can now log in.');
                window.location.href = 'index.html';
            }
        } catch (err) {
            console.error('Registration Error:', err);
            alert(`Registration failed: ${err.message || 'Unknown error'}`);
        }
    });
}