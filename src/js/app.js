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
	dashboardData();
    cashAccount();
    buyStock();
    sellStock();
    portfolio();
    transactionHistory();
    RNG();
	logout();
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

// LOGOUT
function logout() {
	// Attach event listener
	document.getElementById('logoutButton')?.addEventListener('click', async (event) => {
        // Stop page reloading or navation defaults.
		event.preventDefault();
			
		try {
			// Clear active user data from local storage.
			localStorage.removeItem('activeUser');
			
			// Redirect back to the landing page.
			window.location.replace = 'index.html';
		}
		
		// Catch unexpected errors.
		catch (err) {
    		console.error('LOGOUT ERROR:', err);
    		alert(`ERROR LOGGING OUT: ${err.message || 'Unknown error in the code'}`);
		}
	});
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

// DASHBOARD DATA INITIALIZATION (cash balance and portfolio)
function dashboardData() {
    // Check connection to the DB.
    if (!supabaseClient) {
        return;
    }

    // Get activeUser.
    const currentUser = activeUser();
    if (!currentUser || !currentUser.username) {
        return;
    }

    // Execute async operations.
    (async () => {
        try {
            // Get user cash balance from the DB.
            const { data: userData, error } = await supabaseClient
                .from('users')
                .select('cash_balance')
                .eq('username', currentUser.username)
                .maybeSingle();

            // If DB returns an error, throw error.
            if (error) {
                throw error;
            }
			
            // Add cash balance to the dashboard element.
            if (userData) {             
                const balanceElement = document.getElementById('userCashDisplay');
                if (balanceElement) {
                    balanceElement.textContent = `$${parseFloat(userData.cash_balance).toFixed(2)}`;
                }
            }
        } 
        // Catch unexpected errors.
        catch (err) {
            console.error('Error loading dashboard data:', err);
        }
    })();
	
		// Load portfolio data.
	    portfolio();
	
		// Load Transaction data.
		transactionHistory()
}

// CREATE STOCK
function createStock() {
	// Attach event listener
	document.getElementById('createStockForm')?.addEventListener('submit', async (event) => {
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
        // Catch unexpected errors.
        catch (err) {
            console.error('Stock Creation Error:', err);
            alert(`Error creating stock: ${err.message || 'Unknown error inside the code'}`);
        }
    });
}

// MARKET SETTING
// TODO
function marketSetting() {
	// Attach event listener
	
// Form name: marketSettingsForm
// Element: openTime in the DB: open_time varchar
// Element: closeTime
// Element: holidayDates
// Element: opDays
}

// CASH ACCOUNT
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
		
		// Get activeUser.
		const currentUser = activeUser();
			if (!currentUser || !currentUser.username) {
			alert('No active user found. Please log in.');
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
			
			// Update user balance and catch DB side errors.
			const {error:updateError} = await supabaseClient
				.from('users')
				.update({cash_balance: newBalance})
				.eq('username', currentUser.username);
				
			// Throw error if DB returns error.
			if (updateError)
				throw updateError;
			
			// Update transaction history.
			let cashChange;
			if (action === 'deposit' || action === 'DEPOSIT') {
				cashChange = amount;
			}
			else {
				cashChange = -amount;
			}
			// Update transactions and catch DB side errors.
			const {error: dbError} = await supabaseClient
				.from('transactions')
				.insert([{
					username: currentUser.username,
					transaction_type: action,
					amount: amount,
					cash_change: cashChange,					
				}]);
			
			// Throw error if DB returns error.
			if (dbError)
				throw dbError;
			
			// Pull new balance for dashboard.
			const balanceElement = document.getElementById('userCashDisplay');
			if (balanceElement) {
				balanceElement.textContent = `$${newBalance.toFixed(2)}`;
			}
				
			// DB updated successfully message.
			alert(`Successfully completed ${action} of $${amount.toFixed(2)}`);
		
		// Catch unexpected errors.	
		} catch (err) {
			console.error('Transaction error:', err);
			alert(`Transaction failed: ${err.message || 'Unknown error in the code'}`);
		}
	});
}

// BUY STOCK
function buyStock() {
	// Attach event listener
	document.getElementById('buyStockForm')?.addEventListener('submit', async (event) => {
        // Stop page reloading or navation defaults.
		event.preventDefault();
			
		// Check connection to the DB.
		if (!supabaseClient) {
		    alert('Database connection not available.');
		    return;
		}		
			
		try {
			// Verify it is an customer buying the stock.
			const currentUser = activeUser();
	        // If not a current customer, display message.
	        if (!currentUser || currentUser.role !== 'customer') {
	            alert('You must be a registered customer to purchase stocks!');
	            return;
            }
			
			// Get stock info from the form.
            const buyTicker = document.getElementById('buyTicker').value.trim().toUpperCase();
			const buyVolume = parseInt(document.getElementById('buyVolume').value, 10);		
			
			// Get information from the stocks table, set error.
			const { data: existingStock, error: searchError } = await supabaseClient
				.from('stocks')
				.select('ticker, volume, current_price, company_name')
				.eq('ticker', buyTicker)
				.single();
			
				//Get information from the users table, set error	
			const { data: userData, error: userError } = await supabaseClient
				.from('users')
				.select('cash_balance')
				.eq('username', currentUser.username)
				.single();

			// If the DB action results in an error, throw error.
			if (searchError || userError) throw (searchError || userError);
			
			const cash_balance = userData.cash_balance;
			const current_price = existingStock.current_price;
			const volume = existingStock.volume;

			let stockExists = false;
			// Check if buyTicker is in the DB.
			if (existingStock){
				stockExists = true;
			}
			
			let availableVolume = false;
			let totalCost = 0;
			// Check available stock volume against buyVolume and calculate totalCost.
			if (stockExists && buyVolume <= volume) {
			    totalCost = buyVolume * current_price;
				//Round to two decimals
				totalCost = Math.round(totalCost * 100) / 100;
				availableVolume = true;
			}
			
			let availableCash = false;
			// Check totalCost against cash account
			if (totalCost <= cash_balance){
				availableCash = true;
			}
			
			// Confirm or Cancel the order with the user.
			const confirmBuy = confirm(`BUY ${buyVolume} shares of ${existingStock.company_name} (${buyTicker}) for $${totalCost.toFixed(2)}?`);
			// If canceled send cancel message and stop the buy.
			if (!confirmBuy) {
    			alert('ORDER CANCELLED');
    			return;
			}
			
			let action;
			let cashChange = -totalCost;

			// If block for the buy.
			if (availableCash && availableVolume){
				action = 'BUY';
			
				// Update user balance.
				const newTotal = cash_balance - totalCost;
				await supabaseClient
				.from('users')
				.update({cash_balance: newTotal})
				.eq('username', currentUser.username);
			
				// If stock is already owned, update volume
				const {data: existingPortfolio} = await supabaseClient
					.from('portfolios')
					.select('shares')
					.eq('username', currentUser.username)
					.eq('ticker', buyTicker)
					.maybeSingle();

				if (existingPortfolio) {
					await supabaseClient
					.from('portfolios')
					.update({shares: existingPortfolio.shares + buyVolume})            
					.eq('username', currentUser.username)
					.eq('ticker', buyTicker);
				}
				
				// Update portfolios with new stock purchase.
				else {					
					const { error: insertError } = await supabaseClient.from('portfolios').insert({		                
						username: currentUser.username,
						ticker: buyTicker,						
						shares: buyVolume						
					});
					// If DB error, throw error.
					if (insertError) throw insertError;
				}
			
				// Update remaining volume for the stock.
				const {error: updateError} = await supabaseClient
					.from('stocks')
					.update({volume: volume - buyVolume})
					.eq('ticker', buyTicker);					
				
				if (updateError) throw updateError;
						
				// Update transactions and catch DB side errors.
				const {error: dbError} = await supabaseClient
					.from('transactions')
					.insert([{
						username: currentUser.username,
						transaction_type: action,
						amount: totalCost,
						cash_change: cashChange					
					}]);
							
				if (dbError) throw dbError;
				
			// Reset the form elements and reload the page.
			document.getElementById('buyStockForm').reset();
			location.reload();
			}
		}
		
		// Catch unexpected errors.
		catch (err) {
    		console.error('BUY STOCK ERROR:', err);
    		alert(`ERROR BUYING STOCK: ${err.message || 'Unknown error in the code'}`);
		}
	});
}	

// SELL STOCK
function sellStock() {
	// Attach event listener
	document.getElementById('sellStockForm')?.addEventListener('submit', async (event) => {
        // Stop page reloading or navation defaults.
		event.preventDefault();
			
		// Check connection to the DB.
		if (!supabaseClient) {
		    alert('Database connection not available.');
		    return;
		}		
			
		try {
			// Verify it is an customer selling the stock.
			const currentUser = activeUser();
	        // If not a current customer, display message.
	        if (!currentUser || currentUser.role !== 'customer') {
	            alert('You must be a registered customer to sell stocks!');
	            return;
            }
			
			// Get stock info from the form.
            const sellTicker = document.getElementById('sellTicker').value.trim().toUpperCase();
			const sellVolume = parseInt(document.getElementById('sellVolume').value, 10);		
			
			// Get information from the stocks table, set error.
			const { data: existingStock, error: searchError } = await supabaseClient
				.from('stocks')
				.select('ticker, volume, current_price, company_name')
				.eq('ticker', sellTicker)
				.single();
			
			// Get portfolios information for this stock, set error
			const { data: existingPortfolio, error: portfolioError } = await supabaseClient
				.from('portfolios')
				.select('shares')
				.eq('username', currentUser.username)
				.eq('ticker', sellTicker)
				.maybeSingle();

			// Get information from the users table, set error	
			const { data: userData, error: userError } = await supabaseClient
				.from('users')
				.select('cash_balance')
				.eq('username', currentUser.username)
				.single();

			// If the DB action results in an error, throw error for the table.
			if (searchError || portfolioError || userError) throw (searchError || portfolioError || userError);
			
			const cash_balance = userData.cash_balance;
			const current_price = existingStock.current_price;
			const volume = existingStock.volume;
			
			let ownedShares;
			if (existingPortfolio) {
			    ownedShares = existingPortfolio.shares;
			} else {
			    ownedShares = 0;
			}
			
			let totalSale = 0;
			// Check if user owns the stock and has enough shares to sell.
			if (!existingPortfolio || ownedShares < sellVolume) {
				alert('You do not own enough shares of this stock to sell that volume.');
				return;
			}
			
			// Calculate totalSale and round to two decimals.
			totalSale = sellVolume * current_price;
			totalSale = Math.round(totalSale * 100) / 100;
			
			// Confirm or Cancel the order with the user.
			const confirmSell = confirm(`SELL ${sellVolume} shares of ${existingStock.company_name} (${sellTicker}) for $${totalSale.toFixed(2)}?`);
			// If canceled send cancel message and stop the sell.
			if (!confirmSell) {
    			alert('ORDER CANCELLED');
    			return;
			}
			
			let action;
			let cashChange = totalSale;

			// If block for the sell.
			if (ownedShares >= sellVolume){
				action = 'SELL';
			
				// Update user balance.
				const newTotal = cash_balance + totalSale;
				await supabaseClient
				.from('users')
				.update({cash_balance: newTotal})
				.eq('username', currentUser.username);
			
				// If selling all shares, delete row from portfolios, otherwise update shares
				if (ownedShares === sellVolume) {
					const { error: deleteError } = await supabaseClient
						.from('portfolios')
						.delete()
						.eq('username', currentUser.username)
						.eq('ticker', sellTicker);
					
					if (deleteError) throw deleteError;
				} else {
					const { error: updatePortfolioError } = await supabaseClient
						.from('portfolios')
						.update({shares: ownedShares - sellVolume})            
						.eq('username', currentUser.username)
						.eq('ticker', sellTicker);
						
					if (updatePortfolioError) throw updatePortfolioError;
				}
			
				// Update remaining volume for the stock.
				const {error: updateError} = await supabaseClient
					.from('stocks')
					.update({volume: volume + sellVolume})
					.eq('ticker', sellTicker);					
				
				if (updateError) throw updateError;
						
				// Update transactions and catch DB side errors.
				const {error: dbError} = await supabaseClient
				.from('transactions')
				.insert([{
					username: currentUser.username,
					transaction_type: action,
					company_name: existingStock.company_name,
					ticker: sellTicker,
					volume: sellVolume,
					price_per_share: current_price,
					amount: totalSale,
					cash_change: cashChange					
				}]);
							
				if (dbError) throw dbError;
				
				// Reset the form elements and reload the page.
				document.getElementById('sellStockForm').reset();
				location.reload();
			}
		}
		
		// Catch unexpected errors.
		catch (err) {
    		console.error('SELL STOCK ERROR:', err);
    		alert(`ERROR SELLING STOCK: ${err.message || 'Unknown error in the code'}`);
		}
	});
}

// PORTFOLIO **set as async
async function portfolio() {
    console.log('PORTFOLIO FUNCTION CALLED');

    // Check connection to the DB.
    if (!supabaseClient) {
        alert('Database connection not available.');
        return;
    }       
        
    try {
        // Retrieve active user.
        const currentUser = activeUser();
		
		// Debug in browser console, DELETE ME AFTER FIXES*******
        console.log('ACTIVE USER OBJECT:', currentUser);
		// Debug in browser console, DELETE ME AFTER FIXES*******
        console.log('USER ROLE:', currentUser ? currentUser.role : 'No user');
        
        // If not a current customer or the current user, stop execution.
        if (!currentUser || currentUser.role !== 'customer') {
            console.log('PORTFOLIO STOPPED: User is not a valid customer.');
            return;
        }
		
		// Debug in browser console, DELETE ME AFTER FIXES*******
        console.log('ABOUT TO FIRE SUPABASE QUERY FOR USER:', currentUser.username);

        // Await the Supabase query ***altered from then() structure
        const { data: portfolioData, error: portfolioError } = await supabaseClient
            .from('portfolios')
            .select('ticker, shares, stocks (company_name, current_price, daily_high, daily_low, volume)')
            .eq('username', currentUser.username);			
		
		// Debug in browser console, DELETE ME AFTER FIXES*******
        console.log('AWAIT COMPLETED. RAW PORTFOLIO DATA:', portfolioData);
		// Debug in browser console, DELETE ME AFTER FIXES*******
        console.log('AWAIT COMPLETED. PORTFOLIO ERROR:', portfolioError);

        // If any error from the DB, throw error.
        if (portfolioError) {
            throw portfolioError;
        }

        // Get the table element for the portfolio.
        const portfolioTableElement = document.getElementById('portfolioTable');

        // If table element does not exist on the page, stop execution.
        if (!portfolioTableElement) {
            console.log('PORTFOLIO TABLE ELEMENT NOT FOUND IN DOM');
            return;
        }

        // Initialize variable to hold HTML rows.
        let rowsHTML = '';

        // Loop through all owned stocks in the 'portfolios' table.
        if (portfolioData && portfolioData.length > 0) {
            for (let i = 0; i < portfolioData.length; i++) {
				// Initialize constants for the loop.
                const item = portfolioData[i];                
                const ticker = item.ticker;
                const sharesOwned = item.shares;
				
				// initialize variables for the loop.
                let companyName;
                let singleStockPrice;
                let dailyHigh;
                let dailyLow;
                let availableVol;
				
				// Set variables from the DB.
				if (item.stocks) {
					
		            // Array error where no stock is returned.
		            const stockInfo = Array.isArray(item.stocks) ? item.stocks[0] : item.stocks;
					
					// Get stockInfo from the DB.
		            if (stockInfo) {
		                companyName = stockInfo.company_name;
		                singleStockPrice = stockInfo.current_price;
		                dailyHigh = stockInfo.daily_high;
		                dailyLow = stockInfo.daily_low;
		                availableVol = stockInfo.volume;
					}         
		        }
                
                // Calculate market value.
                let marketValue = sharesOwned * singleStockPrice;
                marketValue = Math.round(marketValue * 100) / 100;

                // Build HTML row matching table headers.
                rowsHTML += `
                    <tr>
                        <td>${companyName}</td>
                        <td>${ticker}</td>
                        <td>$${singleStockPrice.toFixed(2)}</td>
                        <td>${availableVol}</td>
                        <td>$${marketValue.toFixed(2)}</td>
                        <td>$${dailyHigh.toFixed(2)}</td>
                        <td>$${dailyLow.toFixed(2)}</td>
                        <td>${sharesOwned}</td>
                    </tr>
                `;
            }
        } 
        else {
            // If user owns no stocks, display message.
            rowsHTML = `
                <tr>
                    <td colspan="8" style="text-align: center;">You do not own any stocks yet.</td>
                </tr>
            `;
        }

        // Insert the generated rows into the table body element.
        portfolioTableElement.innerHTML = rowsHTML;
    }
    // Catch unknown errors or network/DB issues.
    catch (err) {
        console.error('PORTFOLIO CATCH BLOCK ERROR:', err);
        alert(`THE DB THREW AN ERROR: ${err.message || 'Unknown error in the code'}`);
    }
}

// TRANSACTION HISTORY **set as async
async function transactionHistory() {
    // Check connection to the DB.
    if (!supabaseClient) {
        alert('Database connection not available.');
        return;
    }       
	
	// Try block.       
    try {
        // Retrieve active user.
        const currentUser = activeUser();
				    
        // If not a current customer or the current user, stop execution.
        if (!currentUser || currentUser.role !== 'customer') {
            console.log('ACTION STOPPED: User is not a valid customer.');
            return;
        }		

        // Get all transactions from the DB. Await the Supabase query.
        const { data: transactionData, error: transactionError } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('username', currentUser.username);
			// Set the order of transactions with newest on top.
			.order('timestamp', {ascending: false})	

        // If error from the DB, throw error.
        if (transactionError) {
            throw transactionError;
        }

        // Get the table element for transactions.
        const transactionTableElement = document.getElementById('historyTable');

        // If table element does not exist on the page, stop execution.
        if (!transactionTableElement) {
            console.log('TRANSACTION TABLE ELEMENT NOT FOUND IN DOM');
            return;
        }

        // Initialize variable to hold HTML rows.
        let rowsHTML = '';

        // Loop through all transactions.
        if (transactionData && transactionData.length > 0) {
            for (let i = 0; i < transactionData.length; i++) {
				// Initialize constants for the loop.
                const item = transactionData[i];                
                const transactionType = item.transaction_type;
                const companyName = item.company_name;
                const ticker = item.ticker;
                const amount = item.amount;
                const pricePerShare = item.price_per_share;
                const cashChange = item.cash_change;
                const timestamp = item.timestamp;

                // Change to a shorter local timestamp format.
                const formattedDate = timestamp ? new Date(timestamp).toLocaleString() : '';

                // Build HTML row matching table headers.
				// compress if/then for SQL.
                rowsHTML += `
                    <tr>
                        <td>${formattedDate}</td>
                        <td>${transactionType}</td>
                        <td>${companyName}</td>
                        <td>${ticker}</td>
                        <td>${amount || 0}</td>						
                        <td>$${pricePerShare != null ? Number(pricePerShare).toFixed(2) : '0.00'}</td>
                        <td>$${cashChange != null ? Number(cashChange).toFixed(2) : '0.00'}</td>
                    </tr>
                `;
            }
        } 
        else {
            // If user has no transactions, display message.
            rowsHTML = `
                <tr>
                    <td colspan="7" style="text-align: center;">You have not made any transactions.</td>
                </tr>
            `;
        }

        // Insert rows into the table.
        transactionTableElement.innerHTML = rowsHTML;
    }
    // Catch unknown errors or network/DB issues.
    catch (err) {
        console.error('TRANSACTION HISTORY CATCH BLOCK ERROR:', err);
        alert(`THE DB THREW AN ERROR: ${err.message || 'Unknown error in the code'}`);
    }
}

// RANDOM NUMBER GENERATOR
// TODO
function RNG() {
	// Attach event listener
}