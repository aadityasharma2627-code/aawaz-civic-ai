const fs = require('fs');
const path = require('path');

// sql/ files are the single source of truth for the schema.
const read = (file) => fs.readFileSync(path.join(__dirname, '..', '..', 'sql', file), 'utf8');

module.exports = {
  SCHEMA_SQL: read('schema.sql'),
  SEED_SQL: read('seed.sql'),
};