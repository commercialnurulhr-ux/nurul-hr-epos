const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const ReportController = require('./controllers/ReportController');

router.use(authMiddleware);

// Daily reports
router.get('/daily/sales', ReportController.getDailySalesReport);
router.get('/daily/purchases', ReportController.getDailyPurchasesReport);
router.get('/daily/profit', ReportController.getDailyProfitReport);
router.get('/daily/bank', ReportController.getDailyBankReport);
router.get('/daily/cashier', ReportController.getCashierReport);

// Period reports
router.get('/period/sales', ReportController.getPeriodSalesReport);
router.get('/period/profit', ReportController.getPeriodProfitReport);

// Export
router.get('/export/pdf', ReportController.exportToPDF);
router.get('/export/excel', ReportController.exportToExcel);

module.exports = router;
