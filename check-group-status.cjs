const { Client } = require("pg");
async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const result = await client.query('SELECT status, COUNT(*) AS total FROM "study_group" GROUP BY status ORDER BY status');
    console.table(result.rows);
  } finally { await client.end(); }
}
main().catch(console.error);
