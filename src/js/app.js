// INITIALIZE SUPABASE CLIENT
const supabaseUrl = 'https://ymffltlbfjsudxhfxoue.supabase.co';
const supabaseKey = 'sb_publishable_quXXs0juoM6G2G0iJxtJZg_wnMS5cOd';
const supabaseClient = (window.supabase && window.supabase.createClient) 
    ? window.supabase.createClient(supabaseUrl, supabaseKey)
    : null;

// INITIALIZE FUNCTIONS
document.addEventListener('DOMContentLoaded', () => {
    accountAuth();
    createStock();
    marketSetting();
    cashAccount();
    buyStock();
    sellStock();
    portfolio();
    transactionHistory();
    RNG();
});

// Get active user
function activeUser() {
    try {
        return JSON.parse(localStorage.getItem('activeUser'));
    } 
    catch (e) {
        return null;
    }
}

// USER ACCOUNT CREATION
async function createUserAccount(event) {
    event.preventDefault();

    if (!supabaseClient) {
        alert('Database connection not available.');
        return;
    }

    // Get information from the form.
    try {
        const fullName = document.getElementById('fullName').value.trim();
        const username = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('regPassword').value;

        // Check that username is not already used.
        const { data: existingUser, error: checkError } = await supabaseClient
            .from('users')
            .select('username')
            .eq('username', username)
            .maybeSingle();

        if (checkError) throw checkError;

        if (existingUser) {
            alert('Username is unavailable, please use another.');
            return;
        }

        // Create the account in the DB.
        const { error: insertError } = await supabaseClient.from('users').insert([
            {
                full_name: fullName,
                username: username,
                email: email,
                password_hash: password,
                role: 'customer',
                cash_balance: 0.00
            }
        ]);

        // Show error if account creation fails.
        if (insertError) {
            alert(`Error creating account: ${insertError.message}`);
        } 
        else {
            // Message to confirm account creation and prompt login.
            alert('Account created successfully! Please log in!');
            window.location.href = 'index.html';
        }
    } 
    catch (err) {
        console.error('Registration Error:', err);
        alert(`Registration failed: ${err.message || 'Unknown error'}`);
    }
}

// USER LOGIN
async function accountLogin(event) {
    event.preventDefault();

    if (!supabaseClient) {
        alert('Database connection not available.');
        return;
    }

    // Read login name and password.
    try {
        const usernameInput = document.getElementById('username').value.trim();
        const passwordInput = document.getElementById('password').value;

        // Pull authentication info from the DB.
        const { data: user, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('username', usernameInput)
            .eq('password_hash', passwordInput)
            .maybeSingle();

        // If the information does not match throw error.
        if (error || !user) {
            alert('Authentication failed: Invalid username or password.');
            return;
        }

        // Store active user.
        localStorage.setItem('activeUser', JSON.stringify(user));

        // Send to appropriate dashboard.
        if (user.role === 'administrator') {
            window.location.href = 'admin.html';
        } 
        else {
            window.location.href = 'dashboard.html';
        }
    } 
    catch (err) {
        console.error('Login Error:', err);
        alert('An error occurred during login.');
    }
}

// ACCOUNT AUTHENTICATION SETUP
function accountAuth() {
    document.getElementById('registerForm')?.addEventListener('submit', createUserAccount);
    document.getElementById('loginForm')?.addEventListener('submit', accountLogin);
}

// CREATE STOCK (ADMIN)
function createStock() {
    document.getElementById('createStockForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!supabaseClient) {
            alert('Database connection not available.');
            return;
        }

        try {
            const currentUser = activeUser();
            if (!currentUser || currentUser.role !== 'administrator') {
                alert('Administrator authentication required.');
                return;
            }

            const companyName = document.getElementById('companyName').value.trim();
            const ticker = document.getElementById('stockTicker').value.trim().toUpperCase();
            const volume = parseInt(document.getElementById('stockVolume').value, 10);
            const price = parseFloat(document.getElementById('initialPrice').value);

            // Check for existing company name or ticker
            const { data: existingStock, error: searchError } = await supabaseClient
                .from('stocks')
                .select('company_name, ticker')
                .or(`company_name.eq.${companyName},ticker.eq.${ticker}`);

            if (searchError) throw searchError;

            if (existingStock && existingStock.length > 0) {
                alert('Stock creation blocked: Company name or ticker already exists.');
                return;
            }

            const { error: insertError } = await supabaseClient.from('stocks').insert([
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
            } 
            else {
                alert(`Stock ${ticker} created successfully!`);
                document.getElementById('createStockForm').reset();
            }
        } 
        catch (err) {
            console.error('Stock Creation Error:', err);
            alert(`Error creating stock: ${err.message || 'Unknown error'}`);
        }
    });
}

// MARKET SETTING PLACEHOLDER
function marketSetting() {
    // TODO
}

// CASH ACCOUNT PLACEHOLDER
function cashAccount() {
    // TODO
}

// BUY STOCK PLACEHOLDER
function buyStock() {
    // TODO
}

// SELL STOCK PLACEHOLDER
function sellStock() {
    // TODO
}

// PORTFOLIO PLACEHOLDER
function portfolio() {
    // TODO
}

// TRANSACTION HISTORY PLACEHOLDER
function transactionHistory() {
    // TODO
}

// RANDOM NUMBER GENERATOR
function RNG() {
    // TODO
}