const db = require('../../database');
const logger = require('../../utils/logger');
const AuditService = require('../../services/AuditService');
const bwip = require('bwip-js');

class BarcodeController {
  static async scanBarcode(req, res, next) {
    try {
      const { barcode } = req.body;
      const pool = db.getPostgresPool();

      // Search for barcode
      const result = await pool.query(
        `SELECT pb.product_id, p.* FROM product_barcodes pb
         JOIN products p ON pb.product_id = p.id
         WHERE pb.barcode = $1`,
        [barcode]
      );

      if (result.rows.length > 0) {
        // Barcode found
        return res.json({
          found: true,
          product: result.rows[0]
        });
      }

      // Unknown barcode - trigger product creation
      res.json({
        found: false,
        barcode: barcode,
        message: 'Barcode not found. Create new product?'
      });
    } catch (error) {
      next(error);
    }
  }

  static async createUnknownProduct(req, res, next) {
    try {
      const { barcode, name, category_id, selling_price, unit = 'piece' } = req.body;
      const pool = db.getPostgresPool();

      const productCode = `PROD-${Date.now()}`;

      // Create product
      const productResult = await pool.query(
        `INSERT INTO products (code, name, category_id, selling_price, unit, cost_price)
         VALUES ($1, $2, $3, $4, $5, $4)
         RETURNING *`,
        [productCode, name, category_id, selling_price]
      );

      const product = productResult.rows[0];

      // Add barcode as primary
      await pool.query(
        `INSERT INTO product_barcodes (product_id, barcode, barcode_type, is_primary)
         VALUES ($1, $2, 'primary', true)`,
        [product.id, barcode]
      );

      // Initialize inventory
      await pool.query(
        `INSERT INTO inventory (product_id, quantity, reorder_level, min_stock)
         VALUES ($1, 0, 10, 10)`,
        [product.id]
      );

      await AuditService.log(req.user.id, 'CREATE', 'product', product.id, null, { name, barcode });

      logger.info(`New product created from barcode: ${barcode}`);

      res.status(201).json({
        message: 'Product created successfully',
        product: product
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProductBarcodes(req, res, next) {
    try {
      const { productId } = req.params;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        'SELECT * FROM product_barcodes WHERE product_id = $1 ORDER BY is_primary DESC',
        [productId]
      );

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }

  static async addBarcode(req, res, next) {
    try {
      const { productId } = req.params;
      const { barcode, barcode_type = 'secondary', is_primary = false } = req.body;
      const pool = db.getPostgresPool();

      // Check if barcode already exists
      const existing = await pool.query(
        'SELECT id FROM product_barcodes WHERE barcode = $1',
        [barcode]
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Barcode already exists' });
      }

      const result = await pool.query(
        `INSERT INTO product_barcodes (product_id, barcode, barcode_type, is_primary)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [productId, barcode, barcode_type, is_primary]
      );

      await AuditService.log(req.user.id, 'CREATE', 'barcode', result.rows[0].id, null, { barcode, type: barcode_type });

      res.status(201).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  static async updateBarcode(req, res, next) {
    try {
      const { barcodeId } = req.params;
      const { barcode, barcode_type, is_primary } = req.body;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        `UPDATE product_barcodes 
         SET barcode = COALESCE($1, barcode), 
             barcode_type = COALESCE($2, barcode_type),
             is_primary = COALESCE($3, is_primary)
         WHERE id = $4
         RETURNING *`,
        [barcode, barcode_type, is_primary, barcodeId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Barcode not found' });
      }

      await AuditService.log(req.user.id, 'UPDATE', 'barcode', barcodeId, null, { barcode, type: barcode_type });

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  static async deleteBarcode(req, res, next) {
    try {
      const { barcodeId } = req.params;
      const pool = db.getPostgresPool();

      const result = await pool.query(
        'DELETE FROM product_barcodes WHERE id = $1 RETURNING *',
        [barcodeId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Barcode not found' });
      }

      await AuditService.log(req.user.id, 'DELETE', 'barcode', barcodeId, result.rows[0], null);

      res.json({ message: 'Barcode deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async importBarcodes(req, res, next) {
    try {
      res.json({ message: 'Import barcodes functionality' });
    } catch (error) {
      next(error);
    }
  }

  static async generateBarcodeLabel(req, res, next) {
    try {
      const { barcode, text } = req.body;
      
      // Generate barcode using bwip-js
      const png = await bwip.toBuffer({
        bcid: 'code128',
        text: barcode,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center'
      });

      res.type('image/png');
      res.send(png);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BarcodeController;
