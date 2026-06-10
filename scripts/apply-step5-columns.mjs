/**
 * รัน migration ขั้น 5 บน Supabase Cloud
 * ใช้: SUPABASE_DB_PASSWORD=your-db-password node scripts/apply-step5-columns.mjs
 * หรือ: node scripts/apply-step5-columns.mjs your-db-password
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
    "ต้องระบุรหัสผ่าน Database: SUPABASE_DB_PASSWORD=... node scripts/apply-step5-columns.mjs",
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
  add column if not exists winner_announcement_no text null,
  add column if not exists winner_announcement_date date null;

alter table public.projects
  add column if not exists final_agreed_amount numeric null;

comment on column public.projects.winner_announcement_no is
  'เลขที่ประกาศผลผู้ชนะในระบบ e-GP — ขั้นตอนที่ 5';
comment on column public.projects.winner_announcement_date is
  'วันที่ลงนามในประกาศผู้ชนะ — ขั้นตอนที่ 5';

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
         and column_name in ('winner_announcement_no', 'winner_announcement_date', 'final_agreed_amount')
       order by column_name`,
    );
    console.log("OK: migration applied + schema cache reload notified");
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
    "ตรวจ region ใน Supabase Dashboard → Database → Connection string แล้วอัปเดตใน scripts/apply-step5-columns.mjs",
  );
}
process.exit(1);
