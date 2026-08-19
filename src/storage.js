import { createClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const configured = Boolean(URL && KEY);
const sb = configured ? createClient(URL, KEY) : null;

const QUEUE_KEY = "dw26:queue";
const CACHE_KEY = "dw26:cache";

/* ------------------------------------------------------------
   Local cache — the app reads from this instantly on load so a
   dead zone at the first tee doesn't mean a blank scorecard.
   ------------------------------------------------------------ */

function readLocal(name) {
  try {
    return JSON.parse(localStorage.getItem(name) || "{}");
  } catch {
    return {};
  }
}
function writeLocal(name, obj) {
  try {
    localStorage.setItem(name, JSON.stringify(obj));
  } catch {
    /* storage full or blocked — not fatal */
  }
}

export function cacheGet(key) {
  const c = readLocal(CACHE_KEY);
  return key in c ? c[key] : null;
}
function cacheSet(key, value) {
  const c = readLocal(CACHE_KEY);
  c[key] = value;
  writeLocal(CACHE_KEY, c);
}

/* ------------------------------------------------------------
   Write queue — every write lands locally first, then drains to
   Supabase. Nothing is lost if the signal drops mid-round.
   ------------------------------------------------------------ */

const listeners = new Set();
export function onSync(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function announce() {
  const n = Object.keys(readLocal(QUEUE_KEY)).length;
  listeners.forEach((fn) => fn({ pending: n, online: navigator.onLine }));
}

export function pendingCount() {
  return Object.keys(readLocal(QUEUE_KEY)).length;
}

export async function set(key, value) {
  cacheSet(key, value);
  const q = readLocal(QUEUE_KEY);
  q[key] = { value, at: Date.now() };
  writeLocal(QUEUE_KEY, q);
  announce();
  drain();
  return true;
}

let draining = false;
export async function drain() {
  if (!sb || draining || !navigator.onLine) return;
  draining = true;
  try {
    const q = readLocal(QUEUE_KEY);
    for (const [key, entry] of Object.entries(q)) {
      const { error } = await sb
        .from("kv")
        .upsert({ key, value: entry.value, updated_at: new Date().toISOString() });
      if (error) break;
      const current = readLocal(QUEUE_KEY);
      // Only clear if nothing newer was queued while this was in flight.
      if (current[key] && current[key].at === entry.at) {
        delete current[key];
        writeLocal(QUEUE_KEY, current);
      }
    }
  } catch {
    /* retry on the next drain */
  } finally {
    draining = false;
    announce();
  }
}

export async function get(key) {
  const cached = cacheGet(key);
  if (!sb || !navigator.onLine) return cached;
  try {
    const { data, error } = await sb.from("kv").select("value").eq("key", key).maybeSingle();
    if (error || !data) return cached;
    cacheSet(key, data.value);
    return data.value;
  } catch {
    return cached;
  }
}

export async function getMany(keys) {
  const out = {};
  for (const k of keys) out[k] = cacheGet(k);
  if (!sb || !navigator.onLine) return out;
  try {
    const { data, error } = await sb.from("kv").select("key,value").in("key", keys);
    if (error || !data) return out;
    for (const row of data) {
      out[row.key] = row.value;
      cacheSet(row.key, row.value);
    }
  } catch {
    /* cache stands */
  }
  return out;
}

/* Realtime — other phones' entries land within a second. */
export function subscribe(onChange) {
  if (!sb) return () => {};
  const ch = sb
    .channel("dw26")
    .on("postgres_changes", { event: "*", schema: "public", table: "kv" }, (payload) => {
      const row = payload.new;
      if (row && row.key) {
        cacheSet(row.key, row.value);
        onChange(row.key, row.value);
      }
    })
    .subscribe();
  return () => sb.removeChannel(ch);
}

/* Round-trips a real row so a green light means genuinely working, not
   just "keys look present". Returns a plain-English reason on failure. */
export async function testConnection() {
  if (!URL || !KEY) {
    return {
      ok: false,
      reason: "No Supabase keys in this build. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY were missing when Netlify built the site.",
    };
  }
  if (!navigator.onLine) return { ok: false, reason: "This phone is offline." };
  try {
    const probe = { key: "dw26:__probe", value: { at: Date.now() }, updated_at: new Date().toISOString() };
    const { error: wErr } = await sb.from("kv").upsert(probe);
    if (wErr) return { ok: false, reason: `Write refused: ${wErr.message}` };
    const { data, error: rErr } = await sb.from("kv").select("key").eq("key", "dw26:__probe").maybeSingle();
    if (rErr) return { ok: false, reason: `Read refused: ${rErr.message}` };
    if (!data) return { ok: false, reason: "Write reported success but the row isn't there. Check the table policy." };
    return { ok: true, reason: `Connected to ${URL.replace("https://", "")}` };
  } catch (e) {
    return { ok: false, reason: `Could not reach Supabase: ${e.message}` };
  }
}

/* Purely local, per-phone scratch — where this player left off. */
export function getLocal(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}
export function setLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

/* Purely local — which player is on this phone. */
export function getMe() {
  try {
    return localStorage.getItem("dw26:me") || null;
  } catch {
    return null;
  }
}
export function setMe(v) {
  try {
    localStorage.setItem("dw26:me", v);
  } catch {
    /* ignore */
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => { announce(); drain(); });
  window.addEventListener("offline", announce);
  setInterval(drain, 15000);
}
