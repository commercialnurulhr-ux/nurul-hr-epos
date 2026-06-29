const db = require('../../database');
const logger = require('../../utils/logger');

class ReportController {
  static async getDailySalesReport(req, res, next) {
    try {
      const { date = new Date().toISOString().split('T')[0] } = req.query;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        `SELECT 
           COUNT(id) as total_transactions,
           SUM(net_amount) as total_sales,
           SUM(tax_amount) as total_tax,
           SUM(discount_amount) as total_discount,
           AVG(net_amount) as avg_transaction
         FROM transactions
         WHERE DATE(transaction_date) = $1`,
        [date]
      );

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  static async getDailyPurchasesReport(req, res, next) {
    try {
      const { date = new Date().toISOString().split('T')[0] } = req.query;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        `SELECT 
           COUNT(id) as total_purchases,
           SUM(net_amount) as total_purchase_amount,
           COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_purchases,
           COUNT(CASE WHEN payment_status = 'unpaid' THEN 1 END) as unpaid_purchases,
           SUM(CASE WHEN payment_status = 'unpaid' THEN net_amount ELSE 0 END) as outstanding_amount
         FROM purchases
         WHERE DATE(purchase_date) = $1`,
        [date]
      );

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  static async getDailyProfitReport(req, res, next) {
    try {
      const { date = new Date().toISOString().split('T')[0] } = req.query;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        `SELECT 
           SUM(t.net_amount) as total_sales,
           SUM(COALESCE(ti.quantity * p.cost_price, 0)) as cost_of_sales,
           SUM(t.net_amount) - SUM(COALESCE(ti.quantity * p.cost_price, 0)) as gross_profit
         FROM transactions t
         LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
         LEFT JOIN products p ON ti.product_id = p.id
         WHERE DATE(t.transaction_date) = $1`,
        [date]
      );

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  static async getDailyBankReport(req, res, next) {
    try {
      const { date = new Date().toISOString().split('T')[0] } = req.query;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        `SELECT 
           deposit_type,
           COUNT(id) as total_deposits,
           SUM(deposit_amount) as total_amount
         FROM bank_deposits
         WHERE DATE(deposit_date) = $1
         GROUP BY deposit_type`,
        [date]
      );

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }

  static async getCashierReport(req, res, next) {
    try {
      const { date = new Date().toISOString().split('T')[0] } = req.query;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        `SELECT 
           u.id,
           u.full_name,
           COUNT(t.id) as transactions,
           SUM(t.net_amount) as total_sales,
           SUM(t.discount_amount) as total_discount
         FROM users u
         LEFT JOIN transactions t ON u.id = t.cashier_id AND DATE(t.transaction_date) = $1
         WHERE u.role = 'cashier'
         GROUP BY u.id, u.full_name
         ORDER BY total_sales DESC`,
        [date]
      );

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }

  static async getPeriodSalesReport(req, res, next) {
    try {
      const { date_from, date_to } = req.query;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        `SELECT 
           DATE(transaction_date) as date,
           COUNT(id) as transactions,
           SUM(net_amount) as sales,
           SUM(tax_amount) as tax
         FROM transactions
         WHERE transaction_date >= $1 AND transaction_date <= $2
         GROUP BY DATE(transaction_date)
         ORDER BY date DESC`,
        [date_from, date_to]
      );

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }

  static async getPeriodProfitReport(req, res, next) {
    try {
      const { date_from, date_to } = req.query;
      res.json({ message: 'Period profit report' });
    } catch (error) {
      next(error);
    }
  }

  static async exportToPDF(req, res, next) {
    try {
      res.json({ message: 'Export to PDF' });
    } catch (error) {
      next(error);
    }
  }

  static async exportToExcel(req, res, next) {
    try {
      res.json({ message: 'Export to Excel' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReportController;
