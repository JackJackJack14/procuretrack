/**
 * ตรวจสอบคอลัมน์ขั้นตอนที่ 4 ผ่าน PostgREST OpenAPI (ไม่ต้อง login)
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

const step4Columns = [
  "final_agreed_amount",
  "site_supervisor_name",
  "site_supervisor_affiliation",
  "site_engineer_name",
  "winning_bid_amount",
  "winning_bidder_name",
  "egp_doc_request_count",
  "egp_bid_submission_count",
  "evaluation_report_letter_no",
  "evaluation_report_approval_date",
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
const props = spec.components?.schemas?.projects?.properties ?? {};

for (const col of step4Columns) {
  console.log(props[col] ? `OK ${col}` : `MISSING ${col}`);
}

const missing = step4Columns.filter((c) => !props[c]);
process.exit(missing.length > 0 ? 2 : 0);
