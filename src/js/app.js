// INITIALIZE SUPABASE CLIENT
const supabaseUrl = 'https://ymffltlbfjsudxhfxoue.supabase.co';
const supabaseKey = 'sb_publishable_quXXs0juoM6G2G0iJxtJZg_wnMS5cOd';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Get active user from session
function getActiveUser() {
    return JSON.parse(localStorage.getItem('activeUser'));
}

// Check if market is currently open
async function isMarketOpen() {
    const { data, error } = await supabase.from('market_settings').select('*').single();
    if (error || !data) return false;

    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentDateStr = now.toISOString().split('T')[0];

    // Check operational days and holiday list
    if (!data.operational_days.includes(dayName)) return false;
    if (data.holidays && data.holidays.includes(currentDateStr)) return false;

    // Check operational hours (HH:MM format)
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = data.open_time.split(':').map(Number);
    const [closeH, closeM] = data.close_time.split(':').map(Number);

    return currentMinutes >= (openH * 60 + openM) && currentMinutes < (closeH * 60 + closeM);
}

// Function Initialization
document.addEventListener('DOMContentLoaded', () => {
    initAccountAuth();
    initAdminStockCreation();
    initAdminMarketSettings();
    initCashAccount();
    initBuyStock();
    initSellStock();
    renderPortfolio();
    renderTransactionHistory();
    startRNGPriceGenerator();
});

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
                .from('D1_users')
                .select('username')
                .eq('username', username)
                .single();

            if (existingUser) {
                alert('Account creation blocked: Username is already taken.');
                return;
            }

            // Create account
            const { error } = await supabase.from('D1_users').insert([
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
                .from('D1_users')
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

// CHANGE OPERATIONAL HOURS AND DAYS (ADMIN)

function initAdminMarketSettings() {
    const marketSettingsForm = document.getElementById('marketSettingsForm');
    if (marketSettingsForm) {
        marketSettingsForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const currentUser = getActiveUser();
            if (!currentUser || currentUser.role !== 'administrator') {
                alert('Administrator authentication required.');
                return;
            }

            const openTime = document.getElementById('openTime').value;
            const closeTime = document.getElementById('closeTime').value;
            const selectedDays = Array.from(document.querySelectorAll('input[name="opDays"]:checked')).map(el => el.value);
            const holidays = document.getElementById('holidayDates').value.split(',').map(d => d.trim());

            const { error } = await supabase
                .from('market_settings')
                .update({
                    open_time: openTime,
                    close_time: closeTime,
                    operational_days: selectedDays,
                    holidays: holidays
                })
                .eq('id', 1);

            if (error) {
                alert(`Failed to update market settings: ${error.message}`);
            } else {
                alert('Market operational times updated successfully!');
            }
        });
    }
}

// DEPOSIT OR WITHDRAW CASH

function initCashAccount() {
    const cashForm = document.getElementById('cashForm');
    if (cashForm) {
        cashForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const currentUser = getActiveUser();
            if (!currentUser) return;

            const actionType = document.getElementById('cashAction').value; // 'DEPOSIT' or 'WITHDRAW'
            const amount = parseFloat(document.getElementById('cashAmount').value);

            // Fetch fresh account balance
            const { data: user } = await supabase.from('D1_users').select('cash_balance').eq('username', currentUser.username).single();
            let newBalance = user.cash_balance;

            if (actionType === 'WITHDRAW') {
                if (newBalance < amount) {
                    alert('Withdrawal failed: Insufficient cash funds.');
                    return;
                }
                newBalance -= amount;
            } else {
                newBalance += amount;
            }

            // Update balance
            await supabase.from('D1_users').update({ cash_balance: newBalance }).eq('username', currentUser.username);

            // Record transaction history
            await supabase.from('transactions').insert([
                {
                    username: currentUser.username,
                    transaction_type: actionType,
                    amount: amount,
                    cash_change: actionType === 'DEPOSIT' ? amount : -amount,
                    timestamp: new Date().toISOString()
                }
            ]);

            alert(`Successfully completed ${actionType} of $${amount.toFixed(2)}.`);
            window.location.reload();
        });
    }
}

// BUY STOCK

function initBuyStock() {
    const buyForm = document.getElementById('buyStockForm');
    if (buyForm) {
        buyForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const open = await isMarketOpen();
            if (!open) {
                alert('Trade execution blocked: Market is currently closed.');
                return;
            }

            const currentUser = getActiveUser();
            const ticker = document.getElementById('buyTicker').value.toUpperCase().trim();
            const quantity = parseInt(document.getElementById('buyQuantity').value, 10);

            // Verify stock and available volume
            const { data: stock } = await supabase.from('stocks').select('*').eq('ticker', ticker).single();
            if (!stock) {
                alert('Selected stock ticker does not exist.');
                return;
            }
            if (stock.volume < quantity) {
                alert(`Order failed: Only ${stock.volume} shares available.`);
                return;
            }

            // Verify sufficient funds
            const { data: user } = await supabase.from('D1_users').select('cash_balance').eq('username', currentUser.username).single();
            const totalCost = stock.current_price * quantity;
            if (user.cash_balance < totalCost) {
                alert(`Order failed: Insufficient funds. Total cost is $${totalCost.toFixed(2)}.`);
                return;
            }

            // Order confirmation prompt
            const confirmed = confirm(`Confirm BUY order of ${quantity} shares of ${stock.company_name} (${ticker}) for $${totalCost.toFixed(2)}?`);
            if (!confirmed) {
                alert('Order cancelled.');
                return;
            }

            // Execute Trade: Deduct cash, reduce stock volume, add to portfolio, record transaction
            await supabase.from('D1_users').update({ cash_balance: user.cash_balance - totalCost }).eq('username', currentUser.username);
            await supabase.from('stocks').update({ volume: stock.volume - quantity }).eq('ticker', ticker);

            // Add shares to user portfolio
            const { data: existingHolding } = await supabase
                .from('portfolios')
                .select('*')
                .eq('username', currentUser.username)
                .eq('ticker', ticker)
                .single();

            if (existingHolding) {
                await supabase.from('portfolios').update({ shares: existingHolding.shares + quantity }).eq('id', existingHolding.id);
            } else {
                await supabase.from('portfolios').insert([{ username: currentUser.username, ticker: ticker, shares: quantity }]);
            }

            // Record transaction
            await supabase.from('transactions').insert([
                {
                    username: currentUser.username,
                    transaction_type: 'BUY',
                    company_name: stock.company_name,
                    ticker: ticker,
                    volume: quantity,
                    price_per_share: stock.current_price,
                    cash_change: -totalCost,
                    timestamp: new Date().toISOString()
                }
            ]);

            alert('Trade executed successfully!');
            window.location.reload();
        });
    }
}

// SELL STOCK

function initSellStock() {
    const sellForm = document.getElementById('sellStockForm');
    if (sellForm) {
        sellForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const currentUser = getActiveUser();
            const ticker = document.getElementById('sellTicker').value.toUpperCase().trim();
            const quantity = parseInt(document.getElementById('sellQuantity').value, 10);

            // Verify owned shares
            const { data: holding } = await supabase
                .from('portfolios')
                .select('*')
                .eq('username', currentUser.username)
                .eq('ticker', ticker)
                .single();

            if (!holding || holding.shares < quantity) {
                alert('Sell order blocked: Insufficient owned volume of stock.');
                return;
            }

            // Verify current stock price
            const { data: stock } = await supabase.from('stocks').select('*').eq('ticker', ticker).single();
            const totalProceeds = stock.current_price * quantity;

            // Order confirmation prompt
            const confirmed = confirm(`Confirm SELL order of ${quantity} shares of ${stock.company_name} (${ticker}) for $${totalProceeds.toFixed(2)}?`);
            if (!confirmed) {
                alert('Order cancelled.');
                return;
            }

            // Execute Trade: Deposit proceeds, deduct shares, return volume to stock, record transaction
            const { data: user } = await supabase.from('D1_users').select('cash_balance').eq('username', currentUser.username).single();
            await supabase.from('D1_users').update({ cash_balance: user.cash_balance + totalProceeds }).eq('username', currentUser.username);
            await supabase.from('stocks').update({ volume: stock.volume + quantity }).eq('ticker', ticker);

            if (holding.shares === quantity) {
                await supabase.from('portfolios').delete().eq('id', holding.id);
            } else {
                await supabase.from('portfolios').update({ shares: holding.shares - quantity }).eq('id', holding.id);
            }

            // Record transaction
            await supabase.from('transactions').insert([
                {
                    username: currentUser.username,
                    transaction_type: 'SELL',
                    company_name: stock.company_name,
                    ticker: ticker,
                    volume: quantity,
                    price_per_share: stock.current_price,
                    cash_change: totalProceeds,
                    timestamp: new Date().toISOString()
                }
            ]);

            alert('Sale executed successfully!');
            window.location.reload();
        });
    }
}

// VIEW PORTFOLIO

async function renderPortfolio() {
    const portfolioContainer = document.getElementById('portfolioTable');
    if (!portfolioContainer) return;

    const currentUser = getActiveUser();
    if (!currentUser) return;

    // Fetch cash balance
    const { data: user } = await supabase.from('D1_users').select('cash_balance').eq('username', currentUser.username).single();
    const cashElement = document.getElementById('userCashDisplay');
    if (cashElement) cashElement.textContent = `$${user.cash_balance.toFixed(2)}`;

    // Fetch holdings
    const { data: holdings } = await supabase.from('portfolios').select('*').eq('username', currentUser.username);
    portfolioContainer.innerHTML = '';

    if (!holdings || holdings.length === 0) {
        portfolioContainer.innerHTML = '<tr><td colspan="9">No stocks in portfolio.</td></tr>';
        return;
    }

    for (const item of holdings) {
        const { data: stock } = await supabase.from('stocks').select('*').eq('ticker', item.ticker).single();
        if (stock) {
            const marketValue = stock.current_price * item.shares;
            const row = `
                <tr>
                    <td>${stock.company_name}</td>
                    <td>${stock.ticker}</td>
                    <td>$${stock.current_price.toFixed(2)}</td>
                    <td>${stock.volume}</td>
                    <td>$${marketValue.toFixed(2)}</td>
                    <td>$${stock.daily_high.toFixed(2)}</td>
                    <td>$${stock.daily_low.toFixed(2)}</td>
                    <td>${item.shares}</td>
                </tr>
            `;
            portfolioContainer.innerHTML += row;
        }
    }
}

// TRANSACTION HISTORY

async function renderTransactionHistory() {
    const historyContainer = document.getElementById('historyTable');
    if (!historyContainer) return;

    const currentUser = getActiveUser();
    if (!currentUser) return;

    // Query transactions in chronological order (most recent first/ascending)
    const { data: history } = await supabase
        .from('transactions')
        .select('*')
        .eq('username', currentUser.username)
        .order('timestamp', { ascending: false });

    historyContainer.innerHTML = '';

    if (!history || history.length === 0) {
        historyContainer.innerHTML = '<tr><td colspan="6">No transaction history.</td></tr>';
        return;
    }

    history.forEach((tx) => {
        const row = `
            <tr>
                <td>${new Date(tx.timestamp).toLocaleString()}</td>
                <td>${tx.transaction_type}</td>
                <td>${tx.company_name || 'N/A'}</td>
                <td>${tx.volume || 'N/A'}</td>
                <td>${tx.price_per_share ? '$' + tx.price_per_share.toFixed(2) : 'N/A'}</td>
                <td>${tx.cash_change >= 0 ? '+' : ''}$${tx.cash_change.toFixed(2)}</td>
            </tr>
        `;
        historyContainer.innerHTML += row;
    });
}

// RANDOM NUMBER GENERATOR (RNG)

function startRNGPriceGenerator() {
    // Run price update interval every 10 seconds
    setInterval(async () => {
        const open = await isMarketOpen();

        // Stop price changes if market is closed
        if (!open) return;

        const { data: stocks } = await supabase.from('stocks').select('*');
        if (!stocks) return;

        for (const stock of stocks) {
            // Random between -5% and +5%
            const changePercent = (Math.random() * 0.10) - 0.05;
            let newPrice = stock.current_price * (1 + changePercent);
            if (newPrice < 0.01) newPrice = 0.01;

            let updatedHigh = Math.max(stock.daily_high, newPrice);
            let updatedLow = Math.min(stock.daily_low, newPrice);

            // Update database metrics
            await supabase
                .from('stocks')
                .update({
                    current_price: newPrice,
                    daily_high: updatedHigh,
                    daily_low: updatedLow
                })
                .eq('ticker', stock.ticker);
        }
    }, 10000);
}