// INITIALIZE SUPABASE CLIENT
const supabaseUrl = 'https://ymffltlbfjsudxhfxoue.supabase.co';
const supabaseKey = 'sb_publishable_quXXs0juoM6G2G0iJxtJZg_wnMS5cOd';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Get active user from session
function getActiveUser() {
    return JSON.parse(localStorage.getItem('activeUser'));
}

// CREATE USER ACCOUNT AND AUTHENTICATION
function initAccountAuth() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const fullName = document.getElementById('fullName').value.trim();
            const username = document.getElementById('username').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            // Block account creation if username exists
            const { data: existingUser } = await supabase
                .from('users')
                .select('username')
                .eq('username', username)
                .single();

            if (existingUser) {
                alert('Account creation blocked: Username is already taken.');
                return;
            }

            // Create account
            const { error } = await supabase.from('users').insert([
                {
                    full_name: fullName,
                    username: username,
                    email: email,
                    password_hash: password,
                    role: 'customer',
                    cash_balance: 0.00
                }
            ]);

            if (error) {
                alert(`Error creating account: ${error.message}`);
            } else {
                alert('Account created successfully! You can now log in.');
                window.location.href = 'index.html';
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const usernameInput = document.getElementById('username').value.trim();
            const passwordInput = document.getElementById('password').value;

            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', usernameInput)
                .eq('password_hash', passwordInput)
                .single();

            if (error || !user) {
                alert('Authentication failed: Invalid username or password.');
                return;
            }

            // Store active session
            localStorage.setItem('activeUser', JSON.stringify(user));

            // Route based on role
            if (user.role === 'administrator') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        });
    }
}

// CREATE STOCK (ADMIN)
function initAdminStockCreation() {
    const createStockForm = document.getElementById('createStockForm');
    if (createStockForm) {
        createStockForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const currentUser = getActiveUser();
            if (!currentUser || currentUser.role !== 'administrator') {
                alert('Administrator authentication required.');
                return;
            }

            const companyName = document.getElementById('companyName').value.trim();
            const ticker = document.getElementById('stockTicker').value.trim().toUpperCase();
            const volume = parseInt(document.getElementById('stockVolume').value, 10);
            const price = parseFloat(document.getElementById('initialPrice').value);

            // Check if company name or ticker already exists
            const { data: existingStock } = await supabase
                .from('stocks')
                .select('company_name, ticker')
                .or(`company_name.eq."${companyName}",ticker.eq."${ticker}"`);

            if (existingStock && existingStock.length > 0) {
                alert('Stock creation blocked: Company name or ticker already exists.');
                return;
            }

            const { error } = await supabase.from('stocks').insert([
                {
                    company_name: companyName,
                    ticker: ticker,
                    volume: volume,
                    current_price: price,
                    daily_high: price,
                    daily_low: price
                }
            ]);

            if (error) {
                alert(`Error creating stock: ${error.message}`);
            } else {
                alert(`Stock ${ticker} created successfully!`);
                createStockForm.reset();
            }
        });
    }
}

