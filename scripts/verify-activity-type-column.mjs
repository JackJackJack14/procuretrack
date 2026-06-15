/**
 * ตรวจสอบว่าคอลัมน์ activity_type มีใน Supabase หรือไม่
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

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("MISSING_ENV");
  process.exit(1);
}

const sb = createClient(url, key);
const { data, error } = await sb.from("projects").select("id, activity_type").limit(1);

if (error) {
  console.log("ERROR:", error.code, error.message);
  process.exit(2);
}

console.log("OK: activity_type column exists in schema cache");
console.log("SAMPLE:", data);
