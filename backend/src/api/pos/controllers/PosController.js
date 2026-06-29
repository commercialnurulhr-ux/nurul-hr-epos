const db = require('../../database');
const logger = require('../../utils/logger');
const AuditService = require('../../services/AuditService');

class PosController {
  static async createTransaction(req, res, next) {
    try {
      const { items, customer_id, discount_amount = 0, payment_method } = req.body;
      const pool = db.getPostgresPool();

      // Calculate totals
      let totalAmount = 0;
      let taxAmount = 0;

      for (const item of items) {
        const productResult = await pool.query(
          'SELECT selling_price, tax_percent FROM products WHERE id = $1',
          [item.product_id]
        );

        const product = productResult.rows[0];
        const itemTotal = product.selling_price * item.quantity;
        const itemTax = (itemTotal * product.tax_percent) / 100;
        
        totalAmount += itemTotal;
        taxAmount += itemTax;
      }

      const netAmount = totalAmount - discount_amount + taxAmount;
      const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Insert transaction
      const txResult = await pool.query(
        `INSERT INTO transactions 
         (transaction_number, cashier_id, customer_id, total_amount, discount_amount, tax_amount, net_amount, payment_method, payment_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, transaction_number`,
        [transactionNumber, req.user.id, customer_id, totalAmount, discount_amount, taxAmount, netAmount, payment_method, 'pending']
      );

      const transactionId = txResult.rows[0].id;

      // Insert transaction items
      for (const item of items) {
        const productResult = await pool.query(
          'SELECT selling_price, tax_percent FROM products WHERE id = $1',
          [item.product_id]
        );

        const product = productResult.rows[0];
        const lineTotal = product.selling_price * item.quantity;
        const lineTax = (lineTotal * product.tax_percent) / 100;

        await pool.query(
          `INSERT INTO transaction_items 
           (transaction_id, product_id, quantity, unit_price, tax_amount, line_total)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [transactionId, item.product_id, item.quantity, product.selling_price, lineTax, lineTotal + lineTax]
        );

        // Update inventory
        await pool.query(
          'UPDATE inventory SET quantity = quantity - $1 WHERE product_id = $2',
          [item.quantity, item.product_id]
        );
      }

      // Audit log
      await AuditService.log(req.user.id, 'CREATE', 'transaction', transactionId, null, { items, total: netAmount });

      logger.info(`Transaction created: ${transactionNumber}`);

      res.status(201).json({
        transaction_id: transactionId,
        transaction_number: transactionNumber,
        net_amount: netAmount,
        tax_amount: taxAmount
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTransaction(req, res, next) {
    try {
      const { id } = req.params;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        `SELECT t.*, u.full_name as cashier_name
         FROM transactions t
         LEFT JOIN users u ON t.cashier_id = u.id
         WHERE t.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Get items
      const itemsResult = await pool.query(
        `SELECT ti.*, p.name FROM transaction_items ti
         JOIN products p ON ti.product_id = p.id
         WHERE ti.transaction_id = $1`,
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

  static async getTransactions(req, res, next) {
    try {
      const { limit = 50, offset = 0, date_from, date_to } = req.query;
      const pool = db.getPostgresPool();

      let query = 'SELECT * FROM transactions';
      const params = [];

      if (date_from || date_to) {
        const conditions = [];
        if (date_from) {
          conditions.push(`transaction_date >= $${params.length + 1}`);
          params.push(date_from);
        }
        if (date_to) {
          conditions.push(`transaction_date <= $${params.length + 1}`);
          params.push(date_to);
        }
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` ORDER BY transaction_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }

  static async holdTransaction(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const pool = db.getPostgresPool();

      await pool.query(
        'UPDATE transactions SET is_hold = true, hold_reason = $1 WHERE id = $2',
        [reason, id]
      );

      await AuditService.log(req.user.id, 'HOLD', 'transaction', id, { is_hold: false }, { is_hold: true, reason });

      res.json({ message: 'Transaction held successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getHeldTransactions(req, res, next) {
    try {
      const pool = db.getPostgresPool();
      const result = await pool.query(
        'SELECT * FROM transactions WHERE is_hold = true ORDER BY transaction_date DESC'
      );
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }

  static async recallTransaction(req, res, next) {
    try {
      const { id } = req.params;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        'UPDATE transactions SET is_hold = false WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      await AuditService.log(req.user.id, 'RECALL', 'transaction', id, { is_hold: true }, { is_hold: false });

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  static async processPayment(req, res, next) {
    try {
      const { transaction_id, payment_method, cash_received } = req.body;
      const pool = db.getPostgresPool();

      const txResult = await pool.query(
        'SELECT net_amount FROM transactions WHERE id = $1',
        [transaction_id]
      );

      if (txResult.rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const transaction = txResult.rows[0];
      const changeAmount = cash_received - transaction.net_amount;

      await pool.query(
        `UPDATE transactions 
         SET payment_status = 'completed', payment_method = $1, cash_received = $2, change_amount = $3
         WHERE id = $4`,
        [payment_method, cash_received, changeAmount, transaction_id]
      );

      await AuditService.log(req.user.id, 'PAYMENT', 'transaction', transaction_id, null, { payment_method, amount: transaction.net_amount });

      res.json({
        message: 'Payment processed successfully',
        change_amount: changeAmount
      });
    } catch (error) {
      next(error);
    }
  }

  static async splitPayment(req, res, next) {
    try {
      res.json({ message: 'Split payment functionality' });
    } catch (error) {
      next(error);
    }
  }

  static async printReceipt(req, res, next) {
    try {
      const { transactionId } = req.params;
      res.json({ message: 'Receipt printing' });
    } catch (error) {
      next(error);
    }
  }

  static async reprintReceipt(req, res, next) {
    try {
      const { transactionId } = req.params;
      res.json({ message: 'Receipt reprinting' });
    } catch (error) {
      next(error);
    }
  }

  static async getReceipt(req, res, next) {
    try {
      const { transactionId } = req.params;
      res.json({ message: 'Get receipt' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PosController;
