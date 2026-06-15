/**
 * ตรวจสอบคอลัมน์ฟิลด์รายงานผู้บริหารบนตาราง projects (ผ่าน REST API)
 */
import { createClient } from "@supabase/supabase-js";
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

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;
const sb = createClient(url, key);

for (const col of columns) {
  const { error } = await sb.from("projects").select(`id, ${col}`).limit(1);
  console.log(
    error ? `MISSING ${col}: ${error.message}` : `OK ${col}`,
  );
}
