const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const AccountingController = require('./controllers/AccountingController');

router.use(authMiddleware);

// Purchases (Paid/Unpaid tracking)
router.post('/purchases', AccountingController.createPurchase);
router.get('/purchases', AccountingController.getPurchases);
router.get('/purchases/:id', AccountingController.getPurchase);
router.put('/purchases/:id', AccountingController.updatePurchase);
router.post('/purchases/:id/payment', AccountingController.recordPayment);

// Bank Deposits
router.post('/deposits', AccountingController.createDeposit);
router.get('/deposits', AccountingController.getDeposits);
router.get('/deposits/:id', AccountingController.getDeposit);
router.put('/deposits/:id/verify', AccountingController.verifyDeposit);

// Suppliers
router.get('/suppliers', AccountingController.getSuppliers);
router.post('/suppliers', AccountingController.createSupplier);
router.put('/suppliers/:id', AccountingController.updateSupplier);
router.get('/suppliers/:id/balance', AccountingController.getSupplierBalance);
router.get('/suppliers/:id/payments', AccountingController.getSupplierPayments);

// Customer Credit
router.get('/customer-credit', AccountingController.getCustomerCredit);
router.post('/customer-credit', AccountingController.recordCustomerCredit);
router.post('/customer-credit/:id/payment', AccountingController.recordCustomerCreditPayment);

// Cash Book
router.get('/cash-book', AccountingController.getCashBook);

module.exports = router;
