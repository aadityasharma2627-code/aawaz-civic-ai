const { Pool } = require('pg');
const config = require('../config');
const logger = require('../utils/logger');
const { SCHEMA_SQL, SEED_SQL } = require('./schema');

let pool = null;

function getPool() {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env and configure your Postgres/Supabase connection string.');
  }
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
      max: 10,
    });
    pool.on('error', (err) => logger.error('db.pool_error', { message: err.message }));
  }
  return pool;
}

async function query(text, params) {
  return getPool().query(text, params);
}

// Idempotent: creates tables/indexes and seeds departments on every boot.
async function init() {
  const p = getPool();
  await p.query(SCHEMA_SQL);
  await p.query(SEED_SQL);
  logger.info('db.ready', { ssl: config.databaseSsl });
}

async function end() {
  if (pool) await pool.end();
  pool = null;
}

module.exports = { query, init, end };