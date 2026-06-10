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
const key = env.VITE_SUPABASE_ANON_KEY;

const res = await fetch(
  `${url}/rest/v1/projects?select=id,winner_announcement_no,winner_announcement_date&limit=1`,
  {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(10000),
  },
);

const body = await res.text();
if (res.ok) {
  console.log("COLUMNS_OK");
  console.log(body.slice(0, 200));
} else {
  console.log("COLUMNS_MISSING_OR_ERROR", res.status);
  console.log(body.slice(0, 400));
  process.exit(2);
}
