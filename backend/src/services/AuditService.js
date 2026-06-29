const db = require('../database');
const logger = require('./logger');

class AuditService {
  static async log(userId, action, entityType, entityId, oldValues, newValues) {
    try {
      const pool = db.getPostgresPool();
      const computerName = require('os').hostname();

      await pool.query(
        `INSERT INTO audit_log (user_id, computer_name, action, entity_type, entity_id, old_values, new_values)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          computerName,
          action,
          entityType,
          entityId,
          oldValues ? JSON.stringify(oldValues) : null,
          newValues ? JSON.stringify(newValues) : null
        ]
      );
    } catch (error) {
      logger.error('Audit log error:', error);
    }
  }
}

module.exports = AuditService;
