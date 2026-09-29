// INITIALIZE SUPABASE CLIENT
const supabaseUrl = 'https://ymffltlbfjsudxhfxoue.supabase.co';
const supabaseKey = 'sb_publishable_quXXs0juoM6G2G0iJxtJZg_wnMS5cOd';

// Use a unique variable name to prevent conflict with window.supabase
const supabaseClient = (window.supabase && window.supabase.createClient) 
    ? window.supabase.createClient(supabaseUrl, supabaseKey)
    : null;

if (!supabaseClient) {
    console.error('Supabase library failed to load. Check script CDN order in HTML.');
}

// Global Event Listener (Single Entry Point)
document.addEventListener('DOMContentLoaded', () => {
    initAccountAuth();
    initAdminStockCreation();

    // Helper safeguards for dashboard/admin-specific pages
    if (typeof initAdminMarketSettings === 'function') initAdminMarketSettings();
    if (typeof initCashAccount === 'function') initCashAccount();
    if (typeof initBuyStock === 'function') initBuyStock();
    if (typeof initSellStock === 'function') initSellStock();
    if (typeof renderPortfolio === 'function') renderPortfolio();
    if (typeof renderTransactionHistory === 'function') renderTransactionHistory();
    if (typeof startRNGPriceGenerator === 'function') startRNGPriceGenerator();
});

// Get active user from session
function getActiveUser() {
    try {
        return JSON.parse(localStorage.getItem('activeUser'));
    } catch (e) {
        return null;
    }
}

// CREATE USER ACCOUNT AND AUTHENTICATION
function initAccountAuth() {
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
                const username = document.getElementById('regUsername').value.trim();
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('regPassword').value;
                
                // Use maybeSingle() to prevent PGRST116 errors when username is not found
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

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (!supabase) {
                alert('Database connection not available.');
                return;
            }

            try {
                const usernameInput = document.getElementById('username').value.trim();
                const passwordInput = document.getElementById('password').value;

                // Use maybeSingle() to handle missing credentials gracefully
                const { data: user, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('username', usernameInput)
                    .eq('password_hash', passwordInput)
                    .maybeSingle();

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
            } catch (err) {
                console.error('Login Error:', err);
                alert('An error occurred during login.');
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

            if (!supabase) {
                alert('Database connection not available.');
                return;
            }

            try {
                const currentUser = getActiveUser();
                if (!currentUser || currentUser.role !== 'administrator') {
                    alert('Administrator authentication required.');
                    return;
                }

                const companyName = document.getElementById('companyName').value.trim();
                const ticker = document.getElementById('stockTicker').value.trim().toUpperCase();
                const volume = parseInt(document.getElementById('stockVolume').value, 10);
                const price = parseFloat(document.getElementById('initialPrice').value);

                // Check for existing company name or ticker
                const { data: existingStock, error: searchError } = await supabase
                    .from('stocks')
                    .select('company_name, ticker')
                    .or(`company_name.eq.${companyName},ticker.eq.${ticker}`);

                if (searchError) throw searchError;

                if (existingStock && existingStock.length > 0) {
                    alert('Stock creation blocked: Company name or ticker already exists.');
                    return;
                }

                const { error: insertError } = await supabase.from('stocks').insert([
                    {
                        company_name: companyName,
                        ticker: ticker,
                        volume: volume,
                        current_price: price,
                        daily_high: price,
                        daily_low: price
                    }
                ]);

                if (insertError) {
                    alert(`Error creating stock: ${insertError.message}`);
                } else {
                    alert(`Stock ${ticker} created successfully!`);
                    createStockForm.reset();
                }
            } catch (err) {
                console.error('Stock Creation Error:', err);
                alert(`Error creating stock: ${err.message || 'Unknown error'}`);
            }
        });
    }
}