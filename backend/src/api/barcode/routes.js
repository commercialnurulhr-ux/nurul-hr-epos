const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const BarcodeController = require('./controllers/BarcodeController');

router.use(authMiddleware);

// Barcode scanning
router.post('/scan', BarcodeController.scanBarcode);
router.post('/create-unknown-product', BarcodeController.createUnknownProduct);

// Barcode management
router.get('/product/:productId/barcodes', BarcodeController.getProductBarcodes);
router.post('/product/:productId/barcode', BarcodeController.addBarcode);
router.put('/barcode/:barcodeId', BarcodeController.updateBarcode);
router.delete('/barcode/:barcodeId', BarcodeController.deleteBarcode);

// Import barcodes
router.post('/import', BarcodeController.importBarcodes);
router.post('/generate-label', BarcodeController.generateBarcodeLabel);

module.exports = router;
