const { query } = require('../db');

async function listDepartments() {
  const { rows } = await query('SELECT name, category FROM departments ORDER BY id ASC');
  return rows;
}

module.exports = { listDepartments };