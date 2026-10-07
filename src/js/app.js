// INITIALIZE SUPABASE CLIENT
const supabaseUrl = 'https://ymffltlbfjsudxhfxoue.supabase.co';
const supabaseKey = 'sb_publishable_quXXs0juoM6G2G0iJxtJZg_wnMS5cOd';
const supabaseClient = (window.supabase && window.supabase.createClient) 
    ? window.supabase.createClient(supabaseUrl, supabaseKey)
    : null;

// INITIALIZE APP FUNCTIONS AFTER DOM LOADS
document.addEventListener('DOMContentLoaded', () => {
    createUserAccount();
    accountLogin();
    createStock();
    marketSetting();
    cashAccount();
    buyStock();
    sellStock();
    portfolio();
    transactionHistory();
    RNG();
});

// GET ACTIVE USER
function activeUser() {
    try {
        return JSON.parse(localStorage.getItem('activeUser'));
    } 
    catch (e) {
        return null;
    }
}

// USER ACCOUNT CREATION
function createUserAccount() {
    // Attach event listener
	document.getElementById('registerForm')?.addEventListener('submit', async (event) => {
        // Stop page reloading or navation defaults.
		event.preventDefault();

        // Check connection to the DB.
        if (!supabaseClient) {
            alert('Database connection not available.');
            return;
        }
		// Try and Catch block.        
        try {
			// Get information from the form.
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

            // Throw database error to jump to the catch block.
            if (checkError) throw checkError;

            // If username is already used, display message to try again.
            if (existingUser) {
                alert('Username is unavailable, please choose another username.');
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
        // Catch unexpected errors.
        catch (err) {
            console.error('Registration Error:', err);
            alert(`Registration failed: ${err.message || 'Unknown error'}`);
        }
    });
}

// USER LOGIN
function accountLogin() {
	// Attach event listener
	document.getElementById('loginForm')?.addEventListener('submit', async (event) => {
		// Stop page reloading or navation defaults.
		event.preventDefault();

        // Check connection to the DB.
        if (!supabaseClient) {
            alert('Database connection not available.');
            return;
        }

        // Try and catch block.
        try {
			// Read login name and password.
            const usernameInput = document.getElementById('username').value.trim();
            const passwordInput = document.getElementById('password').value;

            // Pull authentication info from the DB.
            const { data: user, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('username', usernameInput)
                .eq('password_hash', passwordInput)
                .maybeSingle();

            // Handle failed login attempt.
            if (error || !user) {
                alert('Authentication failed: Invalid username or password.');
                return;
            }

            // Store active user.
            localStorage.setItem('activeUser', JSON.stringify(user));

            // Redirect user based on their assigned role.
            if (user.role === 'administrator') {
                window.location.href = 'admin.html';
            } 
            else {
                window.location.href = 'dashboard.html';
            }
        } 
        // Catch unexpected errors.
        catch (err) {
            console.error('Login Error:', err);
            alert('An error occurred during login.');
        }
    });
}

// CREATE STOCK
function createStock() {
	// Attach event listener
	document.getElementById('cashForm')?.addEventListener('submit', async (event) => {
		// Stop page reloading or navation defaults.
		event.preventDefault();

        // Check connection to the DB.
        if (!supabaseClient) {
            alert('Database connection not available.');
            return;
        }
			// Try and Catch block.			
	        try {
				// Verify it is an admin creating the stock.
	            const currentUser = activeUser();
	            // If not an admin role, display message.
	            if (!currentUser || currentUser.role !== 'administrator') {
	                alert('Administrator authentication required.');
	                return;
	            }
            // Get stock info from the form.
            const companyName = document.getElementById('companyName').value.trim();
            const ticker = document.getElementById('stockTicker').value.trim().toUpperCase();
            const volume = parseInt(document.getElementById('stockVolume').value, 10);
            const price = parseFloat(document.getElementById('initialPrice').value);

            // Check for existing company name or ticker
            const { data: existingStock, error: searchError } = await supabaseClient
                .from('stocks')
                .select('company_name, ticker')
                .or(`company_name.eq.${companyName},ticker.eq.${ticker}`);

            // If the DB action results in an error, throw error.
            if (searchError) throw searchError;

            // If the stock already exists display message.
            if (existingStock && existingStock.length > 0) {
                alert('Stock Company name or ticker already exists.');
                return;
            }

            // Create stock in DB, if an error is returned store it.
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

            // If there is an error from the DB display error.
            if (insertError) {
                alert(`Error creating stock: ${insertError.message}`);
            } 
            // If no error from the DB, stock created message
            else {
                alert(`Stock ${ticker} created successfully!`);
                document.getElementById('createStockForm').reset();
            }
        }
        // Catch.
        catch (err) {
            console.error('Stock Creation Error:', err);
            alert(`Error creating stock: ${err.message || 'Unknown error'}`);
        }
    });
}

// MARKET SETTING
function marketSetting() {
	// Attach event listener
	
// Form name: marketSettingsForm
// Element: openTime in the DB: open_time varchar
// Element: closeTime
// Element: holidayDates
// Element: opDays
}

// CASH ACCOUNT  ***** DO THIS NEXT add in a logout button *****
function cashAccount() {
	// Attach event listener
	document.getElementById('cashForm')?.addEventListener('submit', async (event) => {
		// Stop page reloading or navigation defaults.
		event.preventDefault();

		// Check connection to the DB.
		if (!supabaseClient) {
			alert('Database connection not available.');
			return; 
		}

		// Try and catch block.
		try {
			// Get info from the form
			const action = document.getElementById('cashAction').value;
			const amount = parseFloat(document.getElementById('cashAmount').value);
						
			// Verify amount is a number and not less than 0.
			if (isNaN(amount) || amount <= 0) {
				alert('Please enter an amount greater than 0!');
				return;
			}

			// Get cash balance for the current user
			const { data: userData, error: userError } = await supabaseClient
				.from('users')
				.select('cash_balance')
				.eq('username', currentUser.username)
				.maybeSingle();
			
			// If DB read problem throw error.
			if (userError)
				throw userError;
			
			// Set newBalance from DB read.
			const balance = parseFloat(userData.cash_balance);
			let newBalance = balance;
			
			// If/else for Deposit and Withdraw
			if (action === 'Withdraw' || action === 'WITHDRAW') {
				// Check to make sure there is enough in the account to withdraw.
				if (balance < amount) {
					alert('Insuffecient Funds!');
					return;
				}
				// Subtract withdraw amount from balance.
				newBalance = balance - amount;
			}
			else {
				// Add deposit amount to balance.
				newBalance = balance + amount;
			}
			
			// Ensure the amount is rounded to 2 decimals.
			newBalance = Math.round(newBalance * 100) / 100;
			
			// Update user balance.
			await supabaseClient
				.from('users')
				.update({cash_balance: newBalance})
				.eq('username', currentUser.username);
			
			// Update transaction history.
			let cashChange;
			if (action === 'deposit' || action === 'DEPOSIT') {
				cashChange = amount;
			}
			else {
				cashChange = -amount;
			}

			await supabaseClient
				.from('transactions')
				.insert([{
					username: currentUser.username,
					transaction_type: action,
					amount: amount,
					cash_change: cashChange,					
				}]);
			
			// DB updated successfully message.
			alert(`Successfully completed ${action} of $${amount.toFixed(2)}`);
			window.location.reload();
		} catch (err) {
			console.error('Transaction error:', err);
			alert(`Transaction failed: ${err.message || 'Unknown error'}`);
		}
	});
}


// BUY STOCK
function buyStock() {
	// Attach event listener
	
// Form name: buyStockForm
// Element: buyTicker
// Element: buyQuantity
}

// SELL STOCK
function sellStock() {
	// Attach event listener
	
// Form name: sellStockForm
// Element: sellTicker
// Element: sellQuantity
}

// PORTFOLIO
function portfolio() {
	// Attach event listener

// Table name: Don't think we need to input anything from the user.
}	
// TRANSACTION HISTORY
function transactionHistory() {
	// Attach event listener
	
// Form name: Nothing needed from the user here.
}

// RANDOM NUMBER GENERATOR
function RNG() {
	// Attach event listener
}