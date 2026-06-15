/**
 * รัน migration median_approval_letter_no + คอลัมน์ขั้น 2 ที่เกี่ยวข้องบน Supabase Cloud
 * ใช้: SUPABASE_DB_PASSWORD=your-db-password node scripts/apply-step2-median-approval-column.mjs
 * หรือ: node scripts/apply-step2-median-approval-column.mjs your-db-password
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
    "ต้องระบุรหัสผ่าน Database: SUPABASE_DB_PASSWORD=... node scripts/apply-step2-median-approval-column.mjs",
  );
  console.error(
    "หาได้ที่ Supabase Dashboard → Project Settings → Database → Database password",
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
  add column if not exists committee_appointment_mode text null,
  add column if not exists committee_appointment_order_no text null,
  add column if not exists committee_appointment_order_date date null,
  add column if not exists approved_median_price numeric null,
  add column if not exists median_price_approval_date date null,
  add column if not exists median_approval_letter_no text null;

alter table public.projects drop constraint if exists projects_committee_appointment_mode_check;
alter table public.projects add constraint projects_committee_appointment_mode_check
  check (committee_appointment_mode is null or committee_appointment_mode in ('combined', 'separate'));

comment on column public.projects.median_approval_letter_no is
  'เลขที่หนังสืออนุมัติราคากลางจากขั้นตอนที่ 2 — ส่งต่อให้ขั้นตอนที่ 3';

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
           'committee_appointment_mode',
           'median_approval_letter_no',
           'approved_median_price',
           'median_price_approval_date'
         )
       order by column_name`,
    );
    console.log("OK: Step 2 columns migration applied + schema cache reload notified");
    console.log("Connected via:", connectionString.replace(/:[^:@]+@/, ":***@"));
    console.table(verify.rows);
    await client.end();
    process.exit(0);
  } catch (err) {
    lastErr = err;
    await client.end().catch(() => {});
  }
}

console.error("Migration failed after trying all connection strings:", lastErr?.message);
if (lastErr?.message?.includes("Tenant or user not found")) {
  console.error(
    "ตรวจ region ใน Supabase Dashboard → Database → Connection string แล้วอัปเดตใน scripts/apply-step2-median-approval-column.mjs",
  );
}
process.exit(1);
