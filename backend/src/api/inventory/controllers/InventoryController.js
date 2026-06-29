const db = require('../../database');
const logger = require('../../utils/logger');
const AuditService = require('../../services/AuditService');

class InventoryController {
  static async getProducts(req, res, next) {
    try {
      const { limit = 50, offset = 0, category_id, search } = req.query;
      const pool = db.getPostgresPool();

      let query = 'SELECT * FROM products WHERE is_active = true';
      const params = [];

      if (category_id) {
        params.push(category_id);
        query += ` AND category_id = $${params.length}`;
      }

      if (search) {
        params.push(`%${search}%`);
        query += ` AND (name ILIKE $${params.length} OR code ILIKE $${params.length})`;
      }

      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }

  static async createProduct(req, res, next) {
    try {
      const { code, name, category_id, supplier_id, cost_price, selling_price, tax_percent = 0, unit = 'piece' } = req.body;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        `INSERT INTO products (code, name, category_id, supplier_id, cost_price, selling_price, tax_percent, unit)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [code, name, category_id, supplier_id, cost_price, selling_price, tax_percent, unit]
      );

      const product = result.rows[0];

      // Initialize inventory
      await pool.query(
        `INSERT INTO inventory (product_id, quantity, reorder_level, min_stock)
         VALUES ($1, 0, 10, 10)`,
        [product.id]
      );

      await AuditService.log(req.user.id, 'CREATE', 'product', product.id, null, { name, code });

      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  }

  static async getProduct(req, res, next) {
    try {
      const { id } = req.params;
      const pool = db.getPostgresPool();

      const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const { name, selling_price, cost_price, tax_percent } = req.body;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        `UPDATE products 
         SET name = COALESCE($1, name),
             selling_price = COALESCE($2, selling_price),
             cost_price = COALESCE($3, cost_price),
             tax_percent = COALESCE($4, tax_percent),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [name, selling_price, cost_price, tax_percent, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      await AuditService.log(req.user.id, 'UPDATE', 'product', id, null, { name, selling_price });

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  static async receiveStock(req, res, next) {
    try {
      const { purchase_id, items } = req.body;
      const pool = db.getPostgresPool();

      for (const item of items) {
        await pool.query(
          `UPDATE inventory 
           SET quantity = quantity + $1,
               batch_number = $2,
               expiry_date = $3,
               manufacturing_date = $4
           WHERE product_id = $5`,
          [item.quantity, item.batch_number, item.expiry_date, item.manufacturing_date, item.product_id]
        );
      }

      await AuditService.log(req.user.id, 'RECEIVE_STOCK', 'purchase', purchase_id, null, items);

      res.json({ message: 'Stock received successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async adjustStock(req, res, next) {
    try {
      const { product_id, quantity_change, reason } = req.body;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        `UPDATE inventory 
         SET quantity = quantity + $1
         WHERE product_id = $2
         RETURNING *`,
        [quantity_change, product_id]
      );

      await AuditService.log(req.user.id, 'ADJUST_STOCK', 'inventory', product_id, null, { quantity_change, reason });

      res.json({ message: 'Stock adjusted', inventory: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }

  static async stockCount(req, res, next) {
    try {
      res.json({ message: 'Stock count functionality' });
    } catch (error) {
      next(error);
    }
  }

  static async transferStock(req, res, next) {
    try {
      res.json({ message: 'Stock transfer functionality' });
    } catch (error) {
      next(error);
    }
  }

  static async getLowStockAlerts(req, res, next) {
    try {
      const pool = db.getPostgresPool();

      const result = await pool.query(
        `SELECT p.id, p.code, p.name, i.quantity, i.reorder_level
         FROM inventory i
         JOIN products p ON i.product_id = p.id
         WHERE i.quantity <= COALESCE(i.reorder_level, 10)
         ORDER BY i.quantity ASC`
      );

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }

  static async getExpiryAlerts(req, res, next) {
    try {
      const expiryDays = parseInt(process.env.EXPIRY_WARNING_DAYS) || 7;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        `SELECT p.id, p.code, p.name, i.expiry_date, i.quantity,
                EXTRACT(DAY FROM i.expiry_date - CURRENT_DATE) as days_remaining
         FROM inventory i
         JOIN products p ON i.product_id = p.id
         WHERE i.expiry_date IS NOT NULL
         AND i.expiry_date <= CURRENT_DATE + INTERVAL '${expiryDays} days'
         AND i.expiry_date > CURRENT_DATE
         ORDER BY i.expiry_date ASC`
      );

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }

  static async getConversions(req, res, next) {
    try {
      const { productId } = req.params;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        'SELECT * FROM conversions WHERE product_id = $1 ORDER BY from_unit',
        [productId]
      );

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }

  static async addConversion(req, res, next) {
    try {
      const { product_id, from_unit, to_unit, conversion_factor } = req.body;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        `INSERT INTO conversions (product_id, from_unit, to_unit, conversion_factor)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [product_id, from_unit, to_unit, conversion_factor]
      );

      await AuditService.log(req.user.id, 'CREATE', 'conversion', result.rows[0].id, null, { from_unit, to_unit, conversion_factor });

      res.status(201).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = InventoryController;
