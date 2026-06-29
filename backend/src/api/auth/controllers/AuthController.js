const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../database');
const logger = require('../../utils/logger');

class AuthController {
  static async login(req, res, next) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      const pool = db.getPostgresPool();
      const result = await pool.query(
        'SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return res.status(403).json({ error: 'User account is inactive' });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
      );

      // Update last login
      await pool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      logger.info(`User logged in: ${username}`);

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async register(req, res, next) {
    try {
      const { username, email, password, full_name, role } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const pool = db.getPostgresPool();

      const result = await pool.query(
        `INSERT INTO users (username, email, password_hash, full_name, role) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role`,
        [username, email, hashedPassword, full_name, role || 'cashier']
      );

      logger.info(`New user registered: ${username}`);

      res.status(201).json({
        message: 'User registered successfully',
        user: result.rows[0]
      });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Username or email already exists' });
      }
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      logger.info(`User logged out: ${req.user.username}`);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentUser(req, res, next) {
    try {
      const pool = db.getPostgresPool();
      const result = await pool.query(
        'SELECT id, username, email, role, full_name FROM users WHERE id = $1',
        [req.user.id]
      );

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const pool = db.getPostgresPool();

      const userResult = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [req.user.id]
      );

      const user = userResult.rows[0];
      const validPassword = await bcrypt.compare(currentPassword, user.password_hash);

      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [hashedPassword, req.user.id]
      );

      logger.info(`User changed password: ${req.user.username}`);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const { token } = req.body;
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

      const newToken = jwt.sign(
        { id: decoded.id, username: decoded.username, role: decoded.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
      );

      res.json({ token: newToken });
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  }
}

module.exports = AuthController;
