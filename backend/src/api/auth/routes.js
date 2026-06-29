const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const AuthController = require('./controllers/AuthController');

// Public routes
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/refresh-token', AuthController.refreshToken);

// Protected routes
router.use(authMiddleware);
router.post('/logout', AuthController.logout);
router.get('/me', AuthController.getCurrentUser);
router.put('/change-password', AuthController.changePassword);

module.exports = router;
