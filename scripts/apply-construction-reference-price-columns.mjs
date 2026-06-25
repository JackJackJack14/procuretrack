/**
 * รัน migration approved_reference_price + reference_price_document_url บน Supabase Cloud
 * ใช้: SUPABASE_DB_PASSWORD=your-db-password node scripts/apply-construction-reference-price-columns.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[line.slice(0, i).trim()] = val;
  }
  return env;
}

const env = loadEnv();
const password =
  process.env.SUPABASE_DB_PASSWORD || env.SUPABASE_DB_PASSWORD || process.argv[2];
const projectRef =
  process.env.SUPABASE_PROJECT_REF ||
  env.VITE_SUPABASE_PROJECT_ID ||
  "azrscsbpehdtwmqrbzxk";

if (!password) {
  console.error(
    "ต้องระบุรหัสผ่าน Database: SUPABASE_DB_PASSWORD=... node scripts/apply-construction-reference-price-columns.mjs",
  );
  console.error(
    "หาได้ที่ Supabase Dashboard → Project Settings → Database → Database password",
  );
  process.exit(1);
}

const sql = fs.readFileSync(
  path.join(__dirname, "sql", "add-construction-reference-price-columns.sql"),
  "utf8",
);

const connectionCandidates = [
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
];

let lastErr;
for (const connectionString of connectionCandidates) {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    await client.query(sql);
    const verify = await client.query(
      `select column_name, data_type, is_nullable
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'projects'
         and column_name in ('approved_reference_price', 'reference_price_document_url')
       order by column_name`,
    );
    console.log("OK: construction reference price columns migration applied");
    console.log("PostgREST schema cache reload notified (NOTIFY pgrst, 'reload schema')");
    console.log("Connected via:", connectionString.replace(/:[^:@]+@/, ":***@"));
    console.table(verify.rows);
    if (verify.rows.length < 2) {
      console.error("WARNING: expected 2 columns, found", verify.rows.length);
      process.exit(1);
    }
    await client.end();
    process.exit(0);
  } catch (err) {
    lastErr = err;
    await client.end().catch(() => {});
  }
}

console.error("Migration failed after trying all connection strings:", lastErr?.message);
process.exit(1);
