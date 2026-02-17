const fs = require('fs');
const path = require('path');
const { pool } = require('../src/db');

async function runDir(dir) {
  const absDir = path.resolve(__dirname, '..', dir);
  const files = fs.readdirSync(absDir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sqlPath = path.join(absDir, file);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`[SQL] Executing ${dir}/${file}...`);
    await pool.query(sql);
    console.log(`[SQL] Completed ${dir}/${file}`);
  }
}

(async () => {
  const cmd = process.argv[2];
  if (!cmd) {
    console.error('Usage: node scripts/run-sql.js <migrations|seeds>');
    process.exit(1);
  }
  try {
    await runDir(cmd);
    console.log(`[SQL] ${cmd} executed successfully.`);
  } catch (err) {
    console.error('[SQL] Error executing SQL:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();