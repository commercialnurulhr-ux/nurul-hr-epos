const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const PosController = require('./controllers/PosController');

router.use(authMiddleware);

// Transactions
router.post('/transaction', PosController.createTransaction);
router.get('/transaction/:id', PosController.getTransaction);
router.get('/transactions', PosController.getTransactions);
router.post('/transaction/:id/hold', PosController.holdTransaction);
router.get('/held-transactions', PosController.getHeldTransactions);
router.post('/transaction/:id/recall', PosController.recallTransaction);

// Payments
router.post('/payment', PosController.processPayment);
router.post('/payment/split', PosController.splitPayment);

// Receipt
router.post('/receipt/:transactionId/print', PosController.printReceipt);
router.post('/receipt/:transactionId/reprint', PosController.reprintReceipt);
router.get('/receipt/:transactionId', PosController.getReceipt);

module.exports = router;
