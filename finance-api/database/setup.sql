-- =============================================================
-- Finance Manager — Database Setup
-- Run: mysql -u root -p < database/setup.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS finance_manager
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE finance_manager;

-- ─── Add reset token columns to users ────────────────────────
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS reset_token         VARCHAR(128) NULL,
    ADD COLUMN IF NOT EXISTS reset_token_expires DATETIME     NULL;

-- ─── Seeds ───────────────────────────────────────────────────
INSERT IGNORE INTO roles (name) VALUES ('admin'), ('user');

-- Admin user (password: Admin@123456)
INSERT IGNORE INTO users (role_id, name, email, password, status)
VALUES (
    1,
    'Administrador',
    'admin@finance.com',
    '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'active'
);

-- ─── Default global categories ───────────────────────────────
INSERT IGNORE INTO categories (user_id, name, type, color, icon) VALUES
-- Income
(NULL, 'Salário',          'income',  '#22c55e', 'wallet'),
(NULL, 'Freelance',        'income',  '#16a34a', 'briefcase'),
(NULL, 'Investimentos',    'income',  '#15803d', 'trending-up'),
(NULL, 'Presente',         'income',  '#86efac', 'gift'),
(NULL, 'Outros Rendimentos','income', '#4ade80', 'plus-circle'),
-- Expense
(NULL, 'Alimentação',      'expense', '#ef4444', 'utensils'),
(NULL, 'Transporte',       'expense', '#f97316', 'car'),
(NULL, 'Habitação',        'expense', '#eab308', 'home'),
(NULL, 'Saúde',            'expense', '#ec4899', 'heart-pulse'),
(NULL, 'Educação',         'expense', '#8b5cf6', 'book-open'),
(NULL, 'Lazer',            'expense', '#3b82f6', 'gamepad-2'),
(NULL, 'Vestuário',        'expense', '#06b6d4', 'shirt'),
(NULL, 'Telecomunicações', 'expense', '#64748b', 'smartphone'),
(NULL, 'Serviços',         'expense', '#94a3b8', 'zap'),
(NULL, 'Outros',           'expense', '#6b7280', 'more-horizontal');

-- ─── Trigger: update account balance on insert ───────────────
DELIMITER $$

DROP TRIGGER IF EXISTS trg_after_transaction_insert$$
CREATE TRIGGER trg_after_transaction_insert
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    IF NEW.type = 'income' THEN
        UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSE
        UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    END IF;
END$$

DELIMITER ;

SELECT 'Database setup complete!' AS status;
