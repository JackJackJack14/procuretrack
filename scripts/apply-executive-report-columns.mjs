/**
 * รัน migration ฟิลด์รายงานผู้บริหาร (activity_type ฯลฯ) บน Supabase Cloud
 * ใช้: SUPABASE_DB_PASSWORD=your-db-password node scripts/apply-executive-report-columns.mjs
 */
import fs from "node:fs";
import pg from "pg";

const { Client } = pg;

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
    "ต้องระบุรหัสผ่าน Database: SUPABASE_DB_PASSWORD=... node scripts/apply-executive-report-columns.mjs",
  );
  process.exit(1);
}

const connectionCandidates = [
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
];

const sql = `
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS activity_type text,
  ADD COLUMN IF NOT EXISTS site_village text,
  ADD COLUMN IF NOT EXISTS site_moo integer,
  ADD COLUMN IF NOT EXISTS site_subdistrict text,
  ADD COLUMN IF NOT EXISTS site_district text,
  ADD COLUMN IF NOT EXISTS site_province text,
  ADD COLUMN IF NOT EXISTS allocated_budget numeric,
  ADD COLUMN IF NOT EXISTS site_supervisor_name text,
  ADD COLUMN IF NOT EXISTS site_supervisor_affiliation text,
  ADD COLUMN IF NOT EXISTS site_engineer_name text;

COMMENT ON COLUMN public.projects.activity_type IS 'ประเภทกิจกรรม/งาน (ขั้นตอนที่ 1)';

NOTIFY pgrst, 'reload schema';
`;

const verifyColumns = [
  "activity_type",
  "site_village",
  "site_moo",
  "site_subdistrict",
  "site_district",
  "site_province",
  "allocated_budget",
  "site_supervisor_name",
  "site_supervisor_affiliation",
  "site_engineer_name",
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
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'projects'
         AND column_name = ANY($1::text[])
       ORDER BY column_name`,
      [verifyColumns],
    );
    console.log("OK: Executive report columns migration applied + schema cache reload notified");
    console.log("Connected via:", connectionString.replace(/:[^:@]+@/, ":***@"));
    console.table(verify.rows);
    await client.end();
    process.exit(0);
  } catch (err) {
    lastErr = err;
    await client.end().catch(() => {});
  }
}

console.error("Migration failed:", lastErr?.message);
process.exit(1);
