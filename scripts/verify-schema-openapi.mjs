/**
 * ตรวจสอบ schema ผ่าน PostgREST OpenAPI (ไม่ต้อง login)
 */
import fs from "node:fs";

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
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;

const columns = [
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

const res = await fetch(`${url}/rest/v1/`, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/openapi+json",
  },
});
if (!res.ok) {
  console.error("OpenAPI fetch failed:", res.status, res.statusText);
  process.exit(1);
}

const spec = await res.json();
const projects = spec.components?.schemas?.projects;
const props = projects?.properties ?? {};

for (const col of columns) {
  console.log(props[col] ? `OK ${col} (${props[col].type ?? "?"})` : `MISSING ${col}`);
}

const missing = columns.filter((c) => !props[c]);
process.exit(missing.length > 0 ? 2 : 0);
