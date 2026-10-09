const db = require('../src/db');

// Safety: never truncate a non-test database.
function assertTestDatabase() {
  const url = process.env.DATABASE_URL || '';
  let pathname = '';
  try { pathname = new URL(url).pathname; } catch { /* custom socket etc. */ }
  if (!/test/i.test(pathname) && process.env.ALLOW_NON_TEST_DB !== 'true') {
    throw new Error(
      `Refusing integration tests against "${pathname || url}". Use a DB whose name ` +
      'contains "test" (e.g. awaaz_test), or set ALLOW_NON_TEST_DB=true to override.'
    );
  }
}

async function initDb() {
  assertTestDatabase();
  await db.init();
}

async function resetDb() {
  await db.query('TRUNCATE status_history, complaints RESTART IDENTITY CASCADE');
  await db.query('ALTER SEQUENCE IF EXISTS awaaz_complaint_seq RESTART WITH 1');
}

module.exports = { initDb, resetDb };