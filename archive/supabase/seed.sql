-- SET INITIAL ADMIN CREDENTIALS AND DEFAULT HOURS
-- Insert Default Administrator
INSERT INTO D1_users (username, password_hash, role, cash_balance)
VALUES ('admin', 'hashed_admin_password', 'administrator', 0.00);

-- Insert Default Market Schedule
INSERT INTO D3_market_schedule (open_time, close_time, is_active_day)
VALUES ('09:30:00', '16:00:00', TRUE);