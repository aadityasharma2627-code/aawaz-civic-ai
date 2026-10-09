process.env.NODE_ENV = 'test';
// Unit tests never touch the DB. Integration tests use this database:
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/awaaz_test';
}
// Force the deterministic fallback classifier so tests are stable & offline.
process.env.AI_API_KEY = '';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';