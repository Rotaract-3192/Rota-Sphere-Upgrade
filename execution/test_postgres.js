const { Client } = require("pg");

const HOST = "db.rotaract3192.org";
const PORT = 5432;
const DBNAME = "postgres";

const passwordsToTry = [
  "Y9#M2!qR7@Lp8Xv$5NtW",
  "postgres",
  "rotaract-admin",
  "9ea8ff2057430ac5ddf8a2bbd9be60ce5a577d45c64cacf41b7ba2c38eaa828b",
];

const usersToTry = ["postgres", "rotaract-admin", "supabase_admin"];

async function main() {
  console.log("Testing PostgreSQL connection via Node pg client...");
  for (const user of usersToTry) {
    for (const pwd of passwordsToTry) {
      const client = new Client({
        host: HOST,
        port: PORT,
        database: DBNAME,
        user: user,
        password: pwd,
        connectionTimeoutMillis: 3000,
        ssl: false,
      });

      try {
        await client.connect();
        console.log(`\n🎉 SUCCESS! Connected as user "${user}"`);
        const res = await client.query(
          "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
        );
        console.log(`Public tables count: ${res.rows.length}`);
        console.log("Tables:", res.rows.map((r) => r.table_name));

        await client.end();
        return;
      } catch (err) {
        // try next
        await client.end().catch(() => {});
      }
    }
  }
  console.log("Finished testing combinations.");
}

main();
