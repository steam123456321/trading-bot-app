-- Migration number: 0001 	 2025-03-21
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS bot_configurations;
DROP TABLE IF EXISTS trading_history;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS api_keys;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- Accounts table (demo and real accounts)
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('demo', 'real')),
  initial_capital REAL NOT NULL,
  current_balance REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bot configurations
CREATE TABLE IF NOT EXISTS bot_configurations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  bot_type TEXT NOT NULL CHECK (bot_type IN ('thousand_trades', 'ten_trades')),
  trading_pair TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT 0,
  entry_percentage REAL NOT NULL,
  take_profit_percentage REAL NOT NULL,
  stop_loss_percentage REAL NOT NULL,
  max_loss_multiplier INTEGER NOT NULL,
  max_loss_multiplier_count INTEGER NOT NULL,
  max_weekly_loss_percentage REAL NOT NULL DEFAULT 20,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Trading history
CREATE TABLE IF NOT EXISTS trading_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bot_config_id INTEGER NOT NULL,
  entry_price REAL NOT NULL,
  exit_price REAL NOT NULL,
  quantity REAL NOT NULL,
  entry_time DATETIME NOT NULL,
  exit_time DATETIME,
  trade_status TEXT NOT NULL CHECK (trade_status IN ('open', 'closed', 'cancelled')),
  profit_loss REAL,
  profit_loss_percentage REAL,
  trade_direction TEXT NOT NULL CHECK (trade_direction IN ('buy', 'sell')),
  exit_reason TEXT CHECK (exit_reason IN ('take_profit', 'stop_loss', 'manual', NULL)),
  loss_multiplier INTEGER DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bot_config_id) REFERENCES bot_configurations(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('profit', 'loss', 'trade', 'system')),
  is_read BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- API Keys for exchange connections
CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  exchange TEXT NOT NULL,
  api_key TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_bot_configurations_account_id ON bot_configurations(account_id);
CREATE INDEX idx_bot_configurations_trading_pair ON bot_configurations(trading_pair);
CREATE INDEX idx_trading_history_bot_config_id ON trading_history(bot_config_id);
CREATE INDEX idx_trading_history_entry_time ON trading_history(entry_time);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
