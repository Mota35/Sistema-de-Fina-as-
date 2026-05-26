-- =============================================================
-- Finance Manager — Full Database Setup
-- Run: mysql -u root -p < database/setup.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS finance_manager
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE finance_manager;

-- ─── Roles ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- ─── Users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    role_id             INT          NOT NULL,
    name                VARCHAR(100) NOT NULL,
    email               VARCHAR(150) NOT NULL UNIQUE,
    password            VARCHAR(255) NOT NULL,
    avatar              VARCHAR(255),
    language            VARCHAR(10)  DEFAULT 'pt',
    theme               ENUM('light','dark') DEFAULT 'light',
    currency            VARCHAR(10)  DEFAULT 'AOA',
    status              ENUM('active','blocked') DEFAULT 'active',
    reset_token         VARCHAR(128) NULL,
    reset_token_expires DATETIME     NULL,
    created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- ─── Accounts ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    name       VARCHAR(100) NOT NULL,
    type       ENUM('wallet','bank','savings','credit_card','investment') NOT NULL,
    balance    DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_account_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Categories ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name    VARCHAR(100) NOT NULL,
    type    ENUM('income','expense') NOT NULL,
    color   VARCHAR(20),
    icon    VARCHAR(100),
    CONSTRAINT fk_category_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Transactions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT          NOT NULL,
    account_id       INT          NOT NULL,
    category_id      INT          NOT NULL,
    type             ENUM('income','expense') NOT NULL,
    amount           DECIMAL(15,2) NOT NULL,
    description      TEXT,
    transaction_date DATE          NOT NULL,
    recurring        BOOLEAN       DEFAULT FALSE,
    created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transaction_user     FOREIGN KEY (user_id)     REFERENCES users(id)       ON DELETE CASCADE,
    CONSTRAINT fk_transaction_account  FOREIGN KEY (account_id)  REFERENCES accounts(id)    ON DELETE CASCADE,
    CONSTRAINT fk_transaction_category FOREIGN KEY (category_id) REFERENCES categories(id)  ON DELETE CASCADE
);

-- ─── Goals ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT          NOT NULL,
    title          VARCHAR(150) NOT NULL,
    target_amount  DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0,
    deadline       DATE,
    CONSTRAINT fk_goal_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Budgets ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT           NOT NULL,
    category_id  INT           NOT NULL,
    limit_amount DECIMAL(15,2) NOT NULL,
    month        VARCHAR(7)    NOT NULL COMMENT 'Format: YYYY-MM',
    created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_budget_user_cat_month (user_id, category_id, month),
    CONSTRAINT fk_budget_user     FOREIGN KEY (user_id)    REFERENCES users(id)      ON DELETE CASCADE,
    CONSTRAINT fk_budget_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- ─── Seeds ───────────────────────────────────────────────────
INSERT IGNORE INTO roles (name) VALUES ('admin'), ('user');

-- Admin: password is Admin@123456
INSERT IGNORE INTO users (role_id, name, email, password, status)
VALUES (1, 'Administrador', 'admin@finance.com',
  '$2y$12$U9uEVjpsR1tR9eEVaGQUd.3hNyQuf7MwSAmNr/Mgxo3UYXJuoL5Ee', 'active');

-- ─── Default global categories ───────────────────────────────
INSERT IGNORE INTO categories (id, user_id, name, type, color, icon) VALUES
(1,  NULL, 'Salário',           'income',  '#22c55e', 'wallet'),
(2,  NULL, 'Freelance',         'income',  '#16a34a', 'briefcase'),
(3,  NULL, 'Investimentos',     'income',  '#15803d', 'trending-up'),
(4,  NULL, 'Presente',          'income',  '#86efac', 'gift'),
(5,  NULL, 'Outros Rendimentos','income',  '#4ade80', 'plus-circle'),
(6,  NULL, 'Alimentação',       'expense', '#ef4444', 'utensils'),
(7,  NULL, 'Transporte',        'expense', '#f97316', 'car'),
(8,  NULL, 'Habitação',         'expense', '#eab308', 'home'),
(9,  NULL, 'Saúde',             'expense', '#ec4899', 'heart-pulse'),
(10, NULL, 'Educação',          'expense', '#8b5cf6', 'book-open'),
(11, NULL, 'Lazer',             'expense', '#3b82f6', 'gamepad-2'),
(12, NULL, 'Vestuário',         'expense', '#06b6d4', 'shirt'),
(13, NULL, 'Telecomunicações',  'expense', '#64748b', 'smartphone'),
(14, NULL, 'Serviços',          'expense', '#94a3b8', 'zap'),
(15, NULL, 'Outros',            'expense', '#6b7280', 'more-horizontal');

-- ─── Trigger: update account balance on transaction insert ────
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

SELECT 'FinStruct database setup complete!' AS status;
