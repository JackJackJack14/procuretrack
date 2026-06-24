/**
 * ตรวจสอบว่าคอลัมน์ egp_project_id / standard_model_code มีใน schema cache หรือยัง
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

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
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, key);
const { data, error } = await supabase
  .from("projects")
  .select("id, egp_project_id, standard_model_code")
  .limit(1);

if (error) {
  console.error("SCHEMA_CHECK_FAILED:", error.message);
  process.exit(1);
}

console.log("SCHEMA_CHECK_OK: columns egp_project_id and standard_model_code are visible");
console.log("sample:", data);
