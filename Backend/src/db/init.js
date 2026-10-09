// Standalone: npm run db:init  (optional — the server also auto-initializes)
const db = require('./index');

db.init()
  .then(() => { console.log('Awaaz schema initialized (idempotent).'); process.exit(0); })
  .catch((err) => { console.error('Schema init failed:', err.message); process.exit(1); });