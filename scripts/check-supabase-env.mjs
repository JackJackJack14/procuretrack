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

const checks = {
  envFileExists: fs.existsSync(path.join(root, ".env")),
  viteSupabaseUrl: Boolean(url && url.startsWith("https://") && url.includes(".supabase.co")),
  viteSupabaseAnonKey: Boolean(key && key.length > 100),
  urlHost: url ? url.replace(/^https:\/\//, "").split("/")[0] : null,
  projectId: env.VITE_SUPABASE_PROJECT_ID || null,
  urlMatchesProjectId: Boolean(
    url &&
      env.VITE_SUPABASE_PROJECT_ID &&
      url.includes(env.VITE_SUPABASE_PROJECT_ID),
  ),
  jwtParts: key ? key.split(".").length : 0,
  jwtRole: null,
  jwtRef: null,
  jwtExpired: null,
};

if (key && checks.jwtParts === 3) {
  try {
    const payload = JSON.parse(
      Buffer.from(key.split(".")[1], "base64url").toString("utf8"),
    );
    checks.jwtRole = payload.role ?? null;
    checks.jwtRef = payload.ref ?? null;
    checks.jwtExpired = typeof payload.exp === "number" ? Date.now() / 1000 > payload.exp : null;
    checks.jwtRefMatchesProject =
      checks.jwtRef != null &&
      checks.projectId != null &&
      checks.jwtRef === checks.projectId;
  } catch {
    checks.jwtParseError = true;
  }
}

let restStatus = null;
let restError = null;
let projectsStatus = null;
let projectsCount = null;
let projectsError = null;

if (checks.viteSupabaseUrl && checks.viteSupabaseAnonKey) {
  try {
    const health = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    restStatus = health.status;
  } catch (e) {
    restError = e instanceof Error ? e.message : String(e);
  }

  try {
    const res = await fetch(`${url}/rest/v1/projects?select=id,name&limit=5`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
    });
    projectsStatus = res.status;
    if (res.ok) {
      const rows = await res.json();
      projectsCount = Array.isArray(rows) ? rows.length : 0;
    } else {
      projectsError = `${res.status} ${res.statusText}`;
    }
  } catch (e) {
    projectsError = e instanceof Error ? e.message : String(e);
  }
}

console.log(JSON.stringify({ checks, restStatus, restError, projectsStatus, projectsCount, projectsError }, null, 2));
