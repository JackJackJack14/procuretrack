/**
 * รัน migration ขั้น 8 บน Supabase Cloud
 * ใช้: SUPABASE_DB_PASSWORD=your-db-password node scripts/apply-step8-columns.mjs
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
    "ต้องระบุรหัสผ่าน Database: SUPABASE_DB_PASSWORD=... node scripts/apply-step8-columns.mjs",
  );
  process.exit(1);
}

const connectionCandidates = [
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
];

const sql = `
alter table public.projects
  add column if not exists contract_no text null,
  add column if not exists contract_signed_date date null,
  add column if not exists contract_guarantee_type text null,
  add column if not exists contract_guarantee_amount numeric null,
  add column if not exists contract_guarantee_document_no text null;

comment on column public.projects.contract_no is 'เลขที่สัญญา — ขั้นตอนที่ 8';
comment on column public.projects.contract_signed_date is 'วันที่ลงนามในสัญญา — ขั้นตอนที่ 8';
comment on column public.projects.contract_guarantee_type is 'ประเภทหลักประกันสัญญา — ขั้นตอนที่ 8';
comment on column public.projects.contract_guarantee_amount is 'มูลค่าหลักประกันสัญญา (บาท) — ขั้นตอนที่ 8';
comment on column public.projects.contract_guarantee_document_no is 'เลขที่เอกสารหลักประกัน — ขั้นตอนที่ 8';

notify pgrst, 'reload schema';
`;

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
      `select column_name, data_type
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'projects'
         and column_name in (
           'contract_no',
           'contract_signed_date',
           'contract_guarantee_type',
           'contract_guarantee_amount',
           'contract_guarantee_document_no'
         )
       order by column_name`,
    );
    console.log("OK: Step 8 migration applied + schema cache reload notified");
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
