const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const InventoryController = require('./controllers/InventoryController');

router.use(authMiddleware);

// Products
router.get('/products', InventoryController.getProducts);
router.post('/products', InventoryController.createProduct);
router.get('/products/:id', InventoryController.getProduct);
router.put('/products/:id', InventoryController.updateProduct);

// Stock management
router.post('/stock/receive', InventoryController.receiveStock);
router.post('/stock/adjust', InventoryController.adjustStock);
router.post('/stock/count', InventoryController.stockCount);
router.post('/stock/transfer', InventoryController.transferStock);
router.get('/stock/low', InventoryController.getLowStockAlerts);
router.get('/stock/expiry', InventoryController.getExpiryAlerts);

// Conversions
router.get('/conversions/:productId', InventoryController.getConversions);
router.post('/conversions', InventoryController.addConversion);

module.exports = router;
