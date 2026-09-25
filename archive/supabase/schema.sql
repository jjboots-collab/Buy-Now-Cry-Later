-- Table 1 Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP EXISTING TABLES IF RESETTING (CAUTION: Deletes data)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS portfolios CASCADE;
DROP TABLE IF EXISTS market_settings CASCADE;
DROP TABLE IF EXISTS stocks CASCADE;
DROP TABLE IF EXISTS "D1_users" CASCADE;

-- D1_users customer and administrator account storage

CREATE TABLE "D1_users" (
    username VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer', -- 'customer' or 'administrator'
    cash_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- TABLE 2 stocks
-- Handles created stocks and market volume/pricing

CREATE TABLE stocks (
    ticker VARCHAR(10) PRIMARY KEY,
    company_name VARCHAR(100) UNIQUE NOT NULL,
    volume INT NOT NULL DEFAULT 0,
    current_price NUMERIC(10, 2) NOT NULL,
    daily_high NUMERIC(10, 2) NOT NULL,
    daily_low NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE 3 market_settings

CREATE TABLE market_settings (
    id INT PRIMARY KEY DEFAULT 1,
    open_time VARCHAR(5) NOT NULL DEFAULT '09:00',
    close_time VARCHAR(5) NOT NULL DEFAULT '17:00',
    operational_days TEXT[] NOT NULL DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    holidays TEXT[] DEFAULT ARRAY[]::TEXT[],
    CONSTRAINT single_row CHECK (id = 1) -- Ensures only one settings record exists
);

-- TABLE 4 portfolios

CREATE TABLE portfolios (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL REFERENCES "D1_users"(username) ON DELETE CASCADE,
    ticker VARCHAR(10) NOT NULL REFERENCES stocks(ticker) ON DELETE CASCADE,
    shares INT NOT NULL CHECK (shares >= 0),
    UNIQUE(username, ticker)
);

-- TABLE 5: transactions

CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL REFERENCES "D1_users"(username) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL, -- 'DEPOSIT', 'WITHDRAW', 'BUY', 'SELL'
    company_name VARCHAR(100),
    ticker VARCHAR(10),
    volume INT,
    price_per_share NUMERIC(10, 2),
    cash_change NUMERIC(15, 2) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- INITIAL DEFAULT DATA (Seed Data)

-- Default Market Schedule
INSERT INTO market_settings (id, open_time, close_time, operational_days, holidays)
VALUES (1, '09:00', '17:00', ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], ARRAY['2026-12-25', '2026-01-01'])
ON CONFLICT (id) DO NOTHING;

-- Default Administrator Account
INSERT INTO "D1_users" (username, full_name, email, password_hash, role, cash_balance)
VALUES ('admin', 'System Administrator', 'admin@buynowcrylater.com', 'admin123', 'administrator', 0.00)
ON CONFLICT (username) DO NOTHING;