const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const MigrationController = require('./controllers/MigrationController');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.use(authMiddleware);

// Migration wizard
router.post('/wizard/start', MigrationController.startMigration);
router.post('/wizard/upload', upload.single('file'), MigrationController.uploadFile);
router.post('/wizard/preview', MigrationController.previewData);
router.post('/wizard/validate', MigrationController.validateData);
router.post('/wizard/execute', MigrationController.executeMigration);
router.get('/wizard/:id/progress', MigrationController.getMigrationProgress);
router.post('/wizard/:id/rollback', MigrationController.rollbackMigration);

// Migration logs
router.get('/logs', MigrationController.getMigrationLogs);
router.get('/logs/:id', MigrationController.getMigrationLog);

// Verification
router.get('/verify/:id', MigrationController.getVerificationReport);

module.exports = router;
