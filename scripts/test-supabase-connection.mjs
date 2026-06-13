import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseEnv(filePath) {
  const vars = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    vars[t.slice(0, i).trim()] = v;
  }
  return vars;
}

const env = parseEnv(path.join(root, ".env"));
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("MISSING_ENV", { url: !!url, key: !!key });
  process.exit(1);
}

console.log("URL:", url);
console.log("KEY_LENGTH:", key.length);

const health = await fetch(`${url}/rest/v1/`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
console.log("REST_STATUS:", health.status, health.statusText);

const sb = createClient(url, key);
const { data: projects, error: pErr } = await sb
  .from("projects")
  .select("id, name, organization_id")
  .limit(10);

if (pErr) {
  console.log("PROJECTS_ERROR:", pErr.code, pErr.message);
} else {
  console.log("PROJECTS_ANON_VISIBLE:", projects?.length ?? 0);
  for (const p of projects ?? []) {
    console.log(" -", p.name);
  }
}

const { data: orgs, error: oErr } = await sb
  .from("organizations")
  .select("id, name")
  .limit(5);
if (oErr) console.log("ORGS_ERROR:", oErr.code, oErr.message);
else console.log("ORGS_ANON_VISIBLE:", orgs?.map((o) => o.name).join(", ") || "(none)");
