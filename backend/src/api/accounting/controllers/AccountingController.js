const db = require('../../database');
const logger = require('../../utils/logger');
const AuditService = require('../../services/AuditService');

class AccountingController {
  // Purchases
  static async createPurchase(req, res, next) {
    try {
      const { supplier_id, invoice_number, items, total_amount, tax_amount, notes } = req.body;
      const pool = db.getPostgresPool();

      const purchaseNumber = `PUR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const net_amount = total_amount + (tax_amount || 0);

      // Create purchase
      const result = await pool.query(
        `INSERT INTO purchases (purchase_number, supplier_id, invoice_number, total_amount, tax_amount, net_amount, payment_status)
         VALUES ($1, $2, $3, $4, $5, $6, 'unpaid')
         RETURNING *`,
        [purchaseNumber, supplier_id, invoice_number, total_amount, tax_amount || 0, net_amount]
      );

      const purchase = result.rows[0];

      // Insert purchase items
      for (const item of items) {
        await pool.query(
          `INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_price, batch_number, expiry_date, manufacturing_date, line_total)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [purchase.id, item.product_id, item.quantity, item.unit_price, item.batch_number, item.expiry_date, item.manufacturing_date, item.line_total]
        );
      }

      // Update supplier outstanding balance
      await pool.query(
        'UPDATE suppliers SET outstanding_balance = outstanding_balance + $1 WHERE id = $2',
        [net_amount, supplier_id]
      );

      await AuditService.log(req.user.id, 'CREATE', 'purchase', purchase.id, null, { invoice: invoice_number, total: net_amount });

      logger.info(`Purchase created: ${purchaseNumber}`);

      res.status(201).json(purchase);
    } catch (error) {
      next(error);
    }
  }

  static async getPurchases(req, res, next) {
    try {
      const { limit = 50, offset = 0, supplier_id, payment_status } = req.query;
      const pool = db.getPostgresPool();

      let query = 'SELECT * FROM purchases';
      const params = [];
      const conditions = [];

      if (supplier_id) {
        conditions.push(`supplier_id = $${params.length + 1}`);
        params.push(supplier_id);
      }
      if (payment_status) {
        conditions.push(`payment_status = $${params.length + 1}`);
        params.push(payment_status);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` ORDER BY purchase_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }

  static async getPurchase(req, res, next) {
    try {
      const { id } = req.params;
      const pool = db.getPostgresPool();

      const result = await pool.query('SELECT * FROM purchases WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Purchase not found' });
      }

      const itemsResult = await pool.query(
        `SELECT pi.*, p.name FROM purchase_items pi
         JOIN products p ON pi.product_id = p.id
         WHERE pi.purchase_id = $1`,
        [id]
      );

      res.json({
        ...result.rows[0],
        items: itemsResult.rows
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePurchase(req, res, next) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        'UPDATE purchases SET notes = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [notes, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Purchase not found' });
      }

      await AuditService.log(req.user.id, 'UPDATE', 'purchase', id, null, { notes });

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  static async recordPayment(req, res, next) {
    try {
      const { id } = req.params;
      const { payment_amount, payment_method, reference_number } = req.body;
      const pool = db.getPostgresPool();

      // Get current purchase
      const purchaseResult = await pool.query('SELECT * FROM purchases WHERE id = $1', [id]);
      if (purchaseResult.rows.length === 0) {
        return res.status(404).json({ error: 'Purchase not found' });
      }

      const purchase = purchaseResult.rows[0];
      const newPaidAmount = (purchase.paid_amount || 0) + payment_amount;
      const newOutstandingAmount = purchase.net_amount - newPaidAmount;
      const newPaymentStatus = newOutstandingAmount <= 0 ? 'paid' : (newPaidAmount > 0 ? 'partial' : 'unpaid');

      // Record payment
      await pool.query(
        `INSERT INTO purchase_payments (purchase_id, payment_date, payment_amount, payment_method, reference_number, created_by)
         VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)`,
        [id, payment_amount, payment_method, reference_number, req.user.id]
      );

      // Update purchase
      await pool.query(
        `UPDATE purchases 
         SET paid_amount = $1, outstanding_amount = $2, payment_status = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [newPaidAmount, Math.max(0, newOutstandingAmount), newPaymentStatus, id]
      );

      // Update supplier balance
      await pool.query(
        'UPDATE suppliers SET outstanding_balance = outstanding_balance - $1 WHERE id = $2',
        [payment_amount, purchase.supplier_id]
      );

      await AuditService.log(req.user.id, 'PAYMENT', 'purchase', id, null, { payment_amount, payment_status: newPaymentStatus });

      res.json({ message: 'Payment recorded successfully', payment_status: newPaymentStatus });
    } catch (error) {
      next(error);
    }
  }

  // Bank Deposits
  static async createDeposit(req, res, next) {
    try {
      const { bank_name, account_name, account_number, deposit_amount, deposit_type, reference_number, items } = req.body;
      const pool = db.getPostgresPool();

      const depositNumber = `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const result = await pool.query(
        `INSERT INTO bank_deposits (deposit_number, bank_name, account_name, account_number, deposit_date, deposit_amount, deposit_type, reference_number, created_by)
         VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, $8)
         RETURNING *`,
        [depositNumber, bank_name, account_name, account_number, deposit_amount, deposit_type, reference_number, req.user.id]
      );

      const deposit = result.rows[0];

      // Record deposit items
      if (items && items.length > 0) {
        for (const item of items) {
          await pool.query(
            `INSERT INTO bank_deposit_items (bank_deposit_id, transaction_id, customer_id, amount, description)
             VALUES ($1, $2, $3, $4, $5)`,
            [deposit.id, item.transaction_id, item.customer_id, item.amount, item.description]
          );
        }
      }

      await AuditService.log(req.user.id, 'CREATE', 'bank_deposit', deposit.id, null, { type: deposit_type, amount: deposit_amount });

      logger.info(`Bank deposit created: ${depositNumber}`);

      res.status(201).json(deposit);
    } catch (error) {
      next(error);
    }
  }

  static async getDeposits(req, res, next) {
    try {
      const { limit = 50, offset = 0, deposit_type } = req.query;
      const pool = db.getPostgresPool();

      let query = 'SELECT * FROM bank_deposits';
      const params = [];

      if (deposit_type) {
        params.push(deposit_type);
        query += ` WHERE deposit_type = $${params.length}`;
      }

      query += ` ORDER BY deposit_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }

  static async getDeposit(req, res, next) {
    try {
      const { id } = req.params;
      const pool = db.getPostgresPool();

      const result = await pool.query('SELECT * FROM bank_deposits WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Deposit not found' });
      }

      const itemsResult = await pool.query(
        'SELECT * FROM bank_deposit_items WHERE bank_deposit_id = $1',
        [id]
      );

      res.json({
        ...result.rows[0],
        items: itemsResult.rows
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyDeposit(req, res, next) {
    try {
      const { id } = req.params;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        `UPDATE bank_deposits 
         SET is_verified = true, verified_by = $1, verified_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [req.user.id, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Deposit not found' });
      }

      await AuditService.log(req.user.id, 'VERIFY', 'bank_deposit', id, null, { verified: true });

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  // Suppliers
  static async getSuppliers(req, res, next) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        'SELECT * FROM suppliers WHERE is_active = true ORDER BY name LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }

  static async createSupplier(req, res, next) {
    try {
      const { code, name, company_name, contact_person, email, phone, address, payment_terms } = req.body;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        `INSERT INTO suppliers (code, name, company_name, contact_person, email, phone, address, payment_terms)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [code, name, company_name, contact_person, email, phone, address, payment_terms]
      );

      await AuditService.log(req.user.id, 'CREATE', 'supplier', result.rows[0].id, null, { name, company_name });

      res.status(201).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  static async updateSupplier(req, res, next) {
    try {
      const { id } = req.params;
      const { name, company_name, contact_person, email, phone, address, payment_terms } = req.body;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        `UPDATE suppliers 
         SET name = COALESCE($1, name),
             company_name = COALESCE($2, company_name),
             contact_person = COALESCE($3, contact_person),
             email = COALESCE($4, email),
             phone = COALESCE($5, phone),
             address = COALESCE($6, address),
             payment_terms = COALESCE($7, payment_terms),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $8
         RETURNING *`,
        [name, company_name, contact_person, email, phone, address, payment_terms, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Supplier not found' });
      }

      await AuditService.log(req.user.id, 'UPDATE', 'supplier', id, null, { name, company_name });

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  static async getSupplierBalance(req, res, next) {
    try {
      const { id } = req.params;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        'SELECT id, name, company_name, outstanding_balance FROM suppliers WHERE id = $1',
        [id]
      );

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  static async getSupplierPayments(req, res, next) {
    try {
      const { id } = req.params;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        `SELECT pp.* FROM purchase_payments pp
         JOIN purchases p ON pp.purchase_id = p.id
         WHERE p.supplier_id = $1
         ORDER BY pp.payment_date DESC`,
        [id]
      );

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }

  // Customer Credit
  static async getCustomerCredit(req, res, next) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        `SELECT cc.*, c.name FROM customer_credit cc
         JOIN customers c ON cc.customer_id = c.id
         WHERE cc.status IN ('active', 'partial', 'overdue')
         ORDER BY cc.credit_date DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }

  static async recordCustomerCredit(req, res, next) {
    try {
      const { customer_id, transaction_id, credit_amount, due_date } = req.body;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        `INSERT INTO customer_credit (customer_id, transaction_id, credit_amount, outstanding_amount, due_date, status)
         VALUES ($1, $2, $3, $4, $5, 'active')
         RETURNING *`,
        [customer_id, transaction_id, credit_amount, credit_amount, due_date]
      );

      // Update customer credit balance
      await pool.query(
        'UPDATE customers SET credit_balance = credit_balance + $1 WHERE id = $2',
        [credit_amount, customer_id]
      );

      await AuditService.log(req.user.id, 'CREATE', 'customer_credit', result.rows[0].id, null, { customer_id, amount: credit_amount });

      res.status(201).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  static async recordCustomerCreditPayment(req, res, next) {
    try {
      const { id } = req.params;
      const { payment_amount } = req.body;
      const pool = db.getPostgresPool();

      const creditResult = await pool.query('SELECT * FROM customer_credit WHERE id = $1', [id]);
      if (creditResult.rows.length === 0) {
        return res.status(404).json({ error: 'Customer credit not found' });
      }

      const credit = creditResult.rows[0];
      const newOutstandingAmount = credit.outstanding_amount - payment_amount;
      const newStatus = newOutstandingAmount <= 0 ? 'paid' : 'partial';

      await pool.query(
        `UPDATE customer_credit 
         SET payment_amount = payment_amount + $1, outstanding_amount = $2, status = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [payment_amount, Math.max(0, newOutstandingAmount), newStatus, id]
      );

      // Update customer balance
      await pool.query(
        'UPDATE customers SET credit_balance = credit_balance - $1 WHERE id = $2',
        [payment_amount, credit.customer_id]
      );

      res.json({ message: 'Credit payment recorded successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Cash Book
  static async getCashBook(req, res, next) {
    try {
      const { date_from, date_to } = req.query;
      const pool = db.getPostgresPool();

      let query = 'SELECT * FROM cash_book';
      const params = [];
      const conditions = [];

      if (date_from) {
        conditions.push(`transaction_date >= $${params.length + 1}`);
        params.push(date_from);
      }
      if (date_to) {
        conditions.push(`transaction_date <= $${params.length + 1}`);
        params.push(date_to);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY transaction_date DESC';

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }
}

module.module.exports = AccountingController;
