// Database initialization and pool management
const pg = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

let pgPool = null;
let sqliteDb = null;

// PostgreSQL Pool
const initPostgresPool = () => {
  if (pgPool) return pgPool;

  pgPool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'nurul_hr_epos',
    user: process.env.DB_USER || 'epos_user',
    password: process.env.DB_PASSWORD || 'secure_password',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  pgPool.on('error', (err) => {
    logger.error('PostgreSQL pool error:', err);
  });

  return pgPool;
};

// SQLite Database (Offline)
const initSqliteDb = () => {
  if (sqliteDb) return sqliteDb;

  const dbPath = process.env.OFFLINE_DB_PATH || './data/epos.db';
  
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      logger.error('SQLite connection error:', err);
    } else {
      logger.info(`SQLite connected: ${dbPath}`);
    }
  });

  return sqliteDb;
};

module.exports = {
  getPostgresPool: () => initPostgresPool(),
  getSqliteDb: () => initSqliteDb(),
  closeConnections: async () => {
    if (pgPool) {
      await pgPool.end();
      logger.info('PostgreSQL pool closed');
    }
    if (sqliteDb) {
      sqliteDb.close((err) => {
        if (err) logger.error('SQLite close error:', err);
        else logger.info('SQLite closed');
      });
    }
  }
};
