// Database Schema Migrations
const logger = require('../../utils/logger');
const db = require('./index');

const schemas = {
  // Users and Authentication
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL CHECK (role IN ('master_admin', 'manager', 'cashier')),
      full_name VARCHAR(255),
      branch_id INTEGER,
      is_active BOOLEAN DEFAULT true,
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Products
  products: `
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      code VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category_id INTEGER,
      supplier_id INTEGER,
      cost_price DECIMAL(10,2),
      selling_price DECIMAL(10,2) NOT NULL,
      tax_percent DECIMAL(5,2) DEFAULT 0,
      unit VARCHAR(50),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Product Barcodes (Multiple per product)
  product_barcodes: `
    CREATE TABLE IF NOT EXISTS product_barcodes (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id),
      barcode VARCHAR(255) UNIQUE NOT NULL,
      barcode_type VARCHAR(50) CHECK (barcode_type IN ('primary', 'secondary', 'distributor', 'import')),
      is_primary BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(product_id, barcode_type)
    );
  `,

  // Categories
  categories: `
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Suppliers
  suppliers: `
    CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      code VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      company_name VARCHAR(255),
      contact_person VARCHAR(255),
      email VARCHAR(100),
      phone VARCHAR(20),
      address TEXT,
      city VARCHAR(100),
      country VARCHAR(100),
      tax_id VARCHAR(100),
      payment_terms VARCHAR(100),
      outstanding_balance DECIMAL(12,2) DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Conversion Master
  conversions: `
    CREATE TABLE IF NOT EXISTS conversions (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id),
      from_unit VARCHAR(50) NOT NULL,
      to_unit VARCHAR(50) NOT NULL,
      conversion_factor DECIMAL(10,4) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Inventory Stock
  inventory: `
    CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id),
      warehouse_id INTEGER,
      quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
      reorder_level DECIMAL(10,2),
      min_stock DECIMAL(10,2),
      max_stock DECIMAL(10,2),
      batch_number VARCHAR(100),
      expiry_date DATE,
      manufacturing_date DATE,
      fifo_fefo_type VARCHAR(10) CHECK (fifo_fefo_type IN ('FIFO', 'FEFO')),
      last_counted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // POS Transactions
  transactions: `
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      transaction_number VARCHAR(50) UNIQUE NOT NULL,
      cashier_id INTEGER NOT NULL REFERENCES users(id),
      customer_id INTEGER,
      total_amount DECIMAL(12,2) NOT NULL,
      discount_amount DECIMAL(12,2) DEFAULT 0,
      tax_amount DECIMAL(12,2) DEFAULT 0,
      net_amount DECIMAL(12,2) NOT NULL,
      payment_method VARCHAR(50),
      payment_status VARCHAR(20) CHECK (payment_status IN ('completed', 'partial', 'pending')),
      cash_received DECIMAL(12,2),
      change_amount DECIMAL(12,2),
      is_hold BOOLEAN DEFAULT false,
      hold_reason VARCHAR(255),
      transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Transaction Items
  transaction_items: `
    CREATE TABLE IF NOT EXISTS transaction_items (
      id SERIAL PRIMARY KEY,
      transaction_id INTEGER NOT NULL REFERENCES transactions(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity DECIMAL(10,2) NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      discount_percent DECIMAL(5,2) DEFAULT 0,
      discount_amount DECIMAL(10,2) DEFAULT 0,
      tax_amount DECIMAL(10,2) DEFAULT 0,
      line_total DECIMAL(12,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Purchases (Paid/Unpaid tracking)
  purchases: `
    CREATE TABLE IF NOT EXISTS purchases (
      id SERIAL PRIMARY KEY,
      purchase_number VARCHAR(50) UNIQUE NOT NULL,
      supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
      purchase_date DATE NOT NULL,
      delivery_date DATE,
      invoice_number VARCHAR(100),
      total_amount DECIMAL(12,2) NOT NULL,
      tax_amount DECIMAL(12,2) DEFAULT 0,
      net_amount DECIMAL(12,2) NOT NULL,
      payment_status VARCHAR(20) CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
      paid_amount DECIMAL(12,2) DEFAULT 0,
      outstanding_amount DECIMAL(12,2),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Purchase Items
  purchase_items: `
    CREATE TABLE IF NOT EXISTS purchase_items (
      id SERIAL PRIMARY KEY,
      purchase_id INTEGER NOT NULL REFERENCES purchases(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity DECIMAL(10,2) NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      batch_number VARCHAR(100),
      expiry_date DATE,
      manufacturing_date DATE,
      line_total DECIMAL(12,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Purchase Payments
  purchase_payments: `
    CREATE TABLE IF NOT EXISTS purchase_payments (
      id SERIAL PRIMARY KEY,
      purchase_id INTEGER NOT NULL REFERENCES purchases(id),
      payment_date DATE NOT NULL,
      payment_amount DECIMAL(12,2) NOT NULL,
      payment_method VARCHAR(50),
      reference_number VARCHAR(100),
      notes TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Customers
  customers: `
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      code VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      email VARCHAR(100),
      address TEXT,
      credit_limit DECIMAL(12,2),
      credit_balance DECIMAL(12,2) DEFAULT 0,
      loyalty_points DECIMAL(10,2) DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Customer Credit Transactions
  customer_credit: `
    CREATE TABLE IF NOT EXISTS customer_credit (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      transaction_id INTEGER REFERENCES transactions(id),
      credit_amount DECIMAL(12,2) NOT NULL,
      payment_amount DECIMAL(12,2) DEFAULT 0,
      outstanding_amount DECIMAL(12,2),
      credit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      due_date DATE,
      status VARCHAR(20) CHECK (status IN ('active', 'partial', 'paid', 'overdue')),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Bank Deposits (BIBD - Company)
  bank_deposits: `
    CREATE TABLE IF NOT EXISTS bank_deposits (
      id SERIAL PRIMARY KEY,
      deposit_number VARCHAR(50) UNIQUE NOT NULL,
      bank_name VARCHAR(100),
      account_name VARCHAR(255),
      account_number VARCHAR(50),
      deposit_date DATE NOT NULL,
      deposit_amount DECIMAL(12,2) NOT NULL,
      deposit_type VARCHAR(20) CHECK (deposit_type IN ('company', 'customer')),
      reference_number VARCHAR(100),
      notes TEXT,
      created_by INTEGER REFERENCES users(id),
      verified_by INTEGER REFERENCES users(id),
      is_verified BOOLEAN DEFAULT false,
      verified_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Bank Deposit Items
  bank_deposit_items: `
    CREATE TABLE IF NOT EXISTS bank_deposit_items (
      id SERIAL PRIMARY KEY,
      bank_deposit_id INTEGER NOT NULL REFERENCES bank_deposits(id),
      transaction_id INTEGER REFERENCES transactions(id),
      customer_id INTEGER REFERENCES customers(id),
      amount DECIMAL(12,2) NOT NULL,
      description VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Cash Book
  cash_book: `
    CREATE TABLE IF NOT EXISTS cash_book (
      id SERIAL PRIMARY KEY,
      transaction_date DATE NOT NULL,
      transaction_type VARCHAR(20) CHECK (transaction_type IN ('debit', 'credit')),
      description VARCHAR(255) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      reference_id INTEGER,
      reference_type VARCHAR(50),
      cashier_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Audit Log
  audit_log: `
    CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      computer_name VARCHAR(255),
      action VARCHAR(255) NOT NULL,
      entity_type VARCHAR(50),
      entity_id INTEGER,
      old_values TEXT,
      new_values TEXT,
      action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Migration Logs
  migration_logs: `
    CREATE TABLE IF NOT EXISTS migration_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      computer_name VARCHAR(255),
      migration_date TIMESTAMP,
      source_type VARCHAR(50),
      source_file VARCHAR(255),
      total_records INTEGER,
      imported_records INTEGER,
      skipped_records INTEGER,
      failed_records INTEGER,
      updated_records INTEGER,
      duration_seconds INTEGER,
      status VARCHAR(20),
      error_log TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `
};

const migrate = async () => {
  try {
    const pool = db.getPostgresPool();
    
    for (const [name, schema] of Object.entries(schemas)) {
      await pool.query(schema);
      logger.info(`✓ Migrated table: ${name}`);
    }
    
    logger.info('✓ All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  migrate();
}

module.exports = { schemas, migrate };
