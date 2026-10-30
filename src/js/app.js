// INITIALIZE SUPABASE CLIENT CONNECTION
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
	stocks();
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
		
		// Catch and display errors.
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

            // Call RPC function to create user, use DB to signal DB side variable.
            const { data: result, error: rpcError } = await supabaseClient.rpc('create_user_account', {
                DBfull_name: fullName,
                DBusername: username,
                DBemail: email,
                DBpassword: password
            });

            // Throw RPC error.
            if (rpcError) throw rpcError;

            // If username is already used, display message to try again.
            if (result && result.success === false) {
                alert(result.message || 'Username is unavailable, please choose another username.');
                return;
            }

            // Message to confirm account creation and prompt login.
            alert('Account created successfully! Please log in!');
            window.location.href = 'index.html';
        } 
		
        // Catch and display errors.
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
			// Read login name and password, remove extra spaces.
            const usernameInput = document.getElementById('username').value.trim();
            const passwordInput = document.getElementById('password').value;

            // Send login credentials to DB RPC for authentication.
            const { data: result, error: rpcError } = await supabaseClient.rpc('authenticate_user', {
                DBusername: usernameInput,
                DBpassword: passwordInput
            });

            // Throw RPC error.
            if (rpcError) throw rpcError;

            // If failed login attempt, display alert.
            if (!result || result.success === false) {
                alert('Authentication failed: Invalid username or password.');
                return;
            }

            // Extract user from result.
            const user = result.user;

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
        // Catch and display errors.
        catch (err) {
            console.error('Login Error:', err);
            alert('An error occurred during login.');
        }
    });
}

// DASHBOARD DATA INITIALIZATION (cash, transaction, and portfolio)
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

    // Execute as async.
    (async () => {
		
		// Try and catch block.
        try {
			// Call RPC function to get user cash balance.
			const { data: result, error: error } = await supabaseClient.rpc('get_user_cash_balance', {
				DBusername: currentUser.username
            });

            // If RPC returns an error, throw error.
            if (error) {
                throw error;
            }
			
            // Add cash balance to the dashboard.
            if (result && result.success !== false) {             
                const balanceElement = document.getElementById('userCashDisplay');
                if (balanceElement) {
                    balanceElement.textContent = `$${parseFloat(result.cash_balance).toFixed(2)}`;
                }
            }
        } 
        // Catch and display errors.
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

            // Call RPC function to create stock.
            const { data: result, error: rpcError } = await supabaseClient.rpc('create_stock', {
                DBcompany_name: companyName,
                DBticker: ticker,
                DBvolume: volume,
                DBprice: price
            });

            // If the RPC call results in an error, throw error.
            if (rpcError) throw rpcError;

            // If the stock already exists or creation failed, display alert.
            if (result && result.success === false) {
                alert(result.message || 'Stock Company name or ticker already exists.');
                return;
            }

            // If no error from the DB, show stock created message.
            alert(`Stock ${ticker} created successfully!`);
            document.getElementById('createStockForm').reset();
        }
        // Catch and display errors.
        catch (err) {
            console.error('Stock Creation Error:', err);
            alert(`Error creating stock: ${err.message || 'Unknown error inside the code'}`);
        }
    });
}

// MARKET SETTING
async function marketSetting() {
	// Attach event listener
	document.getElementById('marketSettingsForm')?.addEventListener('submit', async (event) => {
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

            // Get market open and close time from the form, remove whitespace.
            const openTime = document.getElementById('openTime').value.trim();
            const closeTime = document.getElementById('closeTime').value.trim();
			
			// Call RPC function to update the market_settings table for time.
			const {data: times, error: timesError} = await supabaseClient.rpc('set_hours', {
                DBopenTime: openTime,
                DBcloseTime: closeTime,
            });
			
			// If RPC returns error, throw error.
			if (timesError) throw timesError;
			
			// Get and set HTML checkbox boolean for open days.
			const monday = document.getElementById('monday')?.checked || false;
			const tuesday = document.getElementById('tuesday')?.checked || false;
			const wednesday = document.getElementById('wednesday')?.checked || false;
			const thursday = document.getElementById('thursday')?.checked || false;
			const friday = document.getElementById('friday')?.checked || false;
			
			// Call RPC function to update operational_days.
            const {data: days, error: daysError} = await supabaseClient.rpc('set_days', {
                DBmonday: monday,
                DBtuesday: tuesday,
                DBwednesday: wednesday,
                DBthursday: thursday,
				DBfriday: friday,
            });

            // If the RPC call results in an error, throw error.
            if (daysError) throw daysError;
			
			// Get comma seperated list of holidays from the form.
			const holidayDates = document.getElementById('holidayDates')?.value.trim();
			
			// Call RPC function to update holidays in the market_settings table.
			const {data: holidays, error: holidaysError} = await supabaseClient.rpc('set_holidays', {
				DBholidays: holidayDates
			})

			// If the RPC call results in an error, throw error.
			if (holidaysError) throw holidaysError;

            // Alert for successful update and reset the form.
            alert(`Stock Market operational Times, Days, and Holidays have been modified!`);
            document.getElementById('marketSettingsForm').reset();
        }
        // Catch and display errors.
        catch (err) {
            console.error('MARKET SETTINGS ERROR', err);
            alert(`Error setting days: ${err.message || 'Unknown error inside the code'}`);
        }
    });
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
			// Get info from the form.
			const action = document.getElementById('cashAction').value;
			const amount = parseFloat(document.getElementById('cashAmount').value);
						
			// Verify amount is a number and not less than 0.
			if (isNaN(amount) || amount <= 0) {
				alert('Please enter an amount greater than 0!');
				return;
			}

			// Send to RPC function to update transaction.
			const { data: result, error: error } = await supabaseClient.rpc('manage_cash_transaction', {
				DBusername: currentUser.username,
				DBaction: action,
				DBamount: amount
			});

			// Throw error if RPC returns error.
			if (error) throw error;

			// Display transaction failure alert.
			if (result && result.success === false) {
				alert(result.message || 'Transaction failed.');
				return;
			}

			// Pull new balance for dashboard display.
			const balanceElement = document.getElementById('userCashDisplay');
			if (balanceElement) {
				balanceElement.textContent = `$${parseFloat(result.new_balance).toFixed(2)}`;
			}
				
			// DB updated successfully message.
			alert(`Successfully completed ${action} of $${amount.toFixed(2)}`);
			
			// Reset the form after successful transaction.
			document.getElementById('cashForm')?.reset();
		
		// Catch and display errors.	
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
			
			// Get stock info from the form, convert to all caps and trim white space.
            const buyTicker = document.getElementById('buyTicker').value.trim().toUpperCase();
			const buyVolume = parseInt(document.getElementById('buyVolume').value, 10);		
			
			// Verify buyVolume is valid.
			if (isNaN(buyVolume) || buyVolume <= 0) {
				alert('Please enter a valid share volume greater than 0!');
				return;
			}

			// Send to RPC function to check stock/balance and check purchase details.
			const { data: checkResult, error: checkError } = await supabaseClient.rpc('check_buy_stock', {
				DBticker: buyTicker,
				DBvolume: buyVolume,
				DBusername: currentUser.username
			});
			
			// If RPC error, throw error
			if (checkError) throw checkError;
			
			// Display alert for failed RPC funtion.
			if (!checkResult || checkResult.success === false) {
				alert(checkResult.message || 'Unable to process purchase.');
				return;
			}

			// Confirm or Cancel the order with the user.
			const confirmBuy = confirm(`BUY ${buyVolume} shares of ${checkResult.company_name} (${buyTicker}) for $${parseFloat(checkResult.total_cost).toFixed(2)}?`);
			
			// If canceled send cancel message and stop the buy.
			if (!confirmBuy) {
    			alert('ORDER CANCELLED');
    			return;
			}
			
			// Send to RPC function to execute the buy transaction.
			const { data: executeResult, error: executeError } = await supabaseClient.rpc('execute_buy_stock', {
				DBticker: buyTicker,
				DBvolume: buyVolume,
				DBusername: currentUser.username
			});
			
			// If RPC error, throw error.
			if (executeError) throw executeError;
			
			// Display alert for failed purchase.
			if (!executeResult || executeResult.success === false) {
				alert(executeResult.message || 'Stock purchase failed.');
				return;
			}
				
			// Reset the form elements and reload the page.
			document.getElementById('buyStockForm').reset();
			location.reload();
		}
		
		// Catch and display errors.
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
		
		// Try and catch block.	
		try {
			// Verify it is an customer selling the stock.
			const currentUser = activeUser();
	        // If not a current customer, display message.
	        if (!currentUser || currentUser.role !== 'customer') {
	            alert('You must be a registered customer to sell stocks!');
	            return;
            }
			
			// Get stock info from the form, convert to all caps and remove extra white space.
            const sellTicker = document.getElementById('sellTicker').value.trim().toUpperCase();
			const sellVolume = parseInt(document.getElementById('sellVolume').value, 10);		
			
			// Verify sellVolume is valid.
			if (isNaN(sellVolume) || sellVolume <= 0) {
				alert('Please enter a valid share volume greater than 0!');
				return;
			}

			// Send to RPC function to check portfolio shares and check sale details.
			const { data: checkResult, error: checkError } = await supabaseClient.rpc('check_sell_stock', {
				DBticker: sellTicker,
				DBvolume: sellVolume,
				DBusername: currentUser.username
			});

			// If the RPC function returns an error, throw error.
			if (checkError) throw checkError;

			// Handle sale failure (e.g., stock not found or insufficient shares).
			if (!checkResult || checkResult.success === false) {
				alert(checkResult.message || 'You do not own enough shares of this stock to sell that volume.');
				return;
			}
			
			// Confirm or Cancel the order with the user before executing.
			const confirmSell = confirm(`SELL ${sellVolume} shares of ${checkResult.company_name} (${sellTicker}) for $${parseFloat(checkResult.total_sale).toFixed(2)}?`);
			
			// If canceled send cancel message and stop the sell.
			if (!confirmSell) {
    			alert('ORDER CANCELLED');
    			return;
			}
			
			// Send to RPC to execute the confirmed sell transaction.
			const { data: executeResult, error: executeError } = await supabaseClient.rpc('execute_sell_stock', {
				DBticker: sellTicker,
				DBvolume: sellVolume,
				DBusername: currentUser.username
			});
			
			// If RPC fails to update the DB, throw error.
			if (executeError) throw executeError;
			
			// Alert for sale failure.
			if (!executeResult || executeResult.success === false) {
				alert(executeResult.message || 'Stock sale failed.');
				return;
			}
			
			// Reset the form elements and reload the page.
			document.getElementById('sellStockForm').reset();
			location.reload();
		}
		
		// Catch and display errors.
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
        
        // If not a current customer or the current user, stop execution.
        if (!currentUser || currentUser.role !== 'customer') {
            console.log('PORTFOLIO STOPPED: User is not a valid customer.');
            return;
        }		

        // Send to RPC function to retrieve user portfolio data.
        const { data: portfolioData, error: portfolioError } = await supabaseClient.rpc('get_user_portfolio', {
            DBusername: currentUser.username
        });

        // If RPC error, throw error.
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

        // Initialize variable to hold HTML row.
        let rowsHTML = '';

        // Loop through each owned stocks in the 'portfolios' table.
        if (portfolioData && portfolioData.length > 0) {
            for (let i = 0; i < portfolioData.length; i++) {
				// Initialize constants for the loop.
                const item = portfolioData[i];                
                const ticker = item.ticker;
                const sharesOwned = item.shares;
				
				// Initialize variables for the loop.
                let companyName;
                let singleStockPrice;
                let dailyHigh;
                let dailyLow;
                let availableVol;
				
				// Set variables from the DB.
				if (item.stocks) {
					
		            // If an array is returned, get only the first element.
		            const stockInfo = Array.isArray(item.stocks) ? item.stocks[0] : item.stocks;
					
					// Set stockInfo variables.
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

                // Build HTML row matching table headers, two decimal places.
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
                    <td colspan="8" style="text-align: center;">You do not own any stocks.</td>
                </tr>
            `;
        }

        // Insert the generated rows into the table body element.
        portfolioTableElement.innerHTML = rowsHTML;
    }
	
    // Catch and display errors.
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

        // Send to RPC function to retrieve user transaction history.
        const { data: transactionData, error: error } = await supabaseClient.rpc('get_user_transactions', {
            dbusername: currentUser.username
        });	

        // If RPC error, throw error.
        if (error) {
            throw error;
        }

        // Get the table element for transactions.
        const transactionTableElement = document.getElementById('historyTable');

        // If table element does not exist on the page, stop execution.
        if (!transactionTableElement) {
            console.log('TRANSACTION TABLE ELEMENT NOT FOUND IN DOM');
            return;
        }

        // Initialize variable to hold HTML row.
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

                // Change to a shorter local timestamp.
                const formattedDate = timestamp ? new Date(timestamp).toLocaleString() : '';

                // Build HTML row matching table headers, force 2 decimal places.
                rowsHTML += `
                    <tr>
						<td>${formattedDate}</td>
						<td>${transactionType}</td>
						<td>${companyName || '-'}</td>
						<td>${ticker || '-'}</td>
						<td>${pricePerShare != null ? '$' + Number(pricePerShare).toFixed(2) : '-'}</td>
						<td>${amount != null ? '$' + Number(amount).toFixed(2) : '$0.00'}</td>
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
    // Catch and display errors.
    catch (err) {
        console.error('TRANSACTION HISTORY CATCH BLOCK ERROR:', err);
        alert(`THE DB THREW AN ERROR: ${err.message || 'Unknown error in the code'}`);
    }
}

// RANDOM NUMBER GENERATOR
function RNG() {
	// Check for DB connection.
	if (!supabaseClient) return;
	
	// Async function to update stocks and portfolio views.
	setInterval(async () => {
		
		// Try and Catch block.
		try {
			// If the RPC function returns an error, throw error.
			const {error} = await supabaseClient.rpc('run_market_rng');
			if (error) throw error;
			
			// Refresh dashboard info.
			stocks();
			portfolio();
		} 
		
		// Catch and push errors to the console, no alert.
		catch (err) {
            console.error('RNG ERROR:', err.message || err);
        }
	},	
	// Set RNG to run every 10 seconds.
    10000);
}

// VIEW STOCKS **set as async
async function stocks() {
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
	
		// Send to RPC function to retrieve stock data.
		const {data: stockData, error: stockError} = await supabaseClient.rpc('get_stock_data', {
		    dbusername: currentUser.username
		});
		
		// If RPC error, throw error.
        if (stockError) {
            throw stockError;
        }
		
		// Get the table element for transactions.
		const viewStocks = document.getElementById('stocksTable');
		
		// Initialize variable to hold HTML row.
		let rowsHTML = '';
		
		// Loop through all stocks.
		if (stockData && stockData.length > 0) {
		    for (let i = 0; i < stockData.length; i++) {
				// Initialize constants for the loop.
		        const item = stockData[i];
		        const companyName = item.company_name;
		        const ticker = item.ticker;
		        const availVol = item.volume;
		        const pricePerShare = item.price_per_share;
		        const dailyHigh = item.daily_high;
		        const dailyLow = item.daily_low;
				
		        // Build HTML row matching table headers, force 2 decimal places.
		        rowsHTML += `
		            <tr>
						<td>${companyName}</td>
						<td>${ticker}</td>
						<td>${availVol}</td>
						<td>${pricePerShare != null ? '$' + Number(pricePerShare).toFixed(2) : '-'}</td>
						<td>${dailyHigh != null ? '$' + Number(dailyHigh).toFixed(2) : '$0.00'}</td>
						<td>$${dailyLow != null ? Number(dailyLow).toFixed(2) : '0.00'}</td>
		            </tr>
		        `;
		    }
		}
		
		// Insert rows into the table.
		viewStocks.innerHTML = rowsHTML;
	}
	
	
	// Catch and display errors.
    catch (err) {
        console.error('STOCK LOOKUP ERROR:', err);
        alert(`THE RPC THREW AN ERROR: ${err.message || 'Unknown error in the code'}`);
    }
}
