-- CREATION OF THE DATABASE, CAN ALSO DELETE THIS
-- Create D1: Users Table
CREATE TABLE D1_users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer',
    cash_balance DECIMAL(12,2) DEFAULT 0.00
);

-- Create D2: Stocks Table
CREATE TABLE D2_stocks (
    stock_id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) UNIQUE NOT NULL,
    company_name VARCHAR(100) UNIQUE NOT NULL,
    total_volume INT NOT NULL,
    current_price DECIMAL(10,2) NOT NULL
);

-- Create D3: Market Schedule Table
CREATE TABLE D3_market_schedule (
    schedule_id SERIAL PRIMARY KEY,
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_active_day BOOLEAN DEFAULT TRUE
);

-- Create D4: Transaction Ledger Table
CREATE TABLE D4_transaction_ledger (
    transaction_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES D1_users(user_id),
    transaction_type VARCHAR(20) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create D5: Portfolios Table
CREATE TABLE D5_portfolios (
    portfolio_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES D1_users(user_id),
    stock_id INT REFERENCES D2_stocks(stock_id),
    quantity INT NOT NULL,
    average_buy_price DECIMAL(10,2) NOT NULL
);