/**
 * รัน migration egp_project_id + standard_model_code บน Supabase Cloud
 * ใช้: SUPABASE_DB_PASSWORD=your-db-password node scripts/apply-egp-project-id-columns.mjs
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
    "ต้องระบุรหัสผ่าน Database: SUPABASE_DB_PASSWORD=... node scripts/apply-egp-project-id-columns.mjs",
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
  add column if not exists egp_project_id text,
  add column if not exists standard_model_code text;

comment on column public.projects.egp_project_id is 'เลขที่โครงการ e-GP / รหัสโครงการภายใน (บังคับทุกประเภทงาน)';
comment on column public.projects.standard_model_code is 'รหัสแบบมาตรฐาน — เฉพาะงานจ้างก่อสร้าง (ไม่บังคับ)';

update public.projects
set egp_project_id = coalesce(nullif(trim(egp_project_id), ''), nullif(trim(project_code), ''))
where egp_project_id is null or trim(egp_project_id) = '';

update public.projects
set standard_model_code = coalesce(
  nullif(trim(standard_model_code), ''),
  nullif(trim(design_code), '')
)
where standard_model_code is null or trim(standard_model_code) = '';

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
         and column_name in ('egp_project_id', 'standard_model_code')
       order by column_name`,
    );
    console.log("OK: egp_project_id + standard_model_code migration applied");
    console.log("PostgREST schema cache reload notified (NOTIFY pgrst, 'reload schema')");
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
