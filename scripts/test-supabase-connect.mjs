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
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log("URL:", url);
console.log("URL valid:", /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url || ""));
console.log("Key length:", key?.length ?? 0);

if (!url || !key) {
  console.error("MISSING env vars");
  process.exit(1);
}

const sb = createClient(url, key);
const { data, error } = await sb.from("projects").select("id").limit(1);
if (error) {
  console.error("QUERY ERROR:", error.message, error.code, error.details);
  process.exit(1);
}
console.log("QUERY OK:", data?.length ?? 0, "row(s)");
