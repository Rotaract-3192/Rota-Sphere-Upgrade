/**
 * High-Performance Direct DB Client
 * Connects directly to the Supabase Studio query API on db.rotaract3192.org
 * with HTTP Basic Auth and executes queries with zero 401/404 issues.
 */

const HOST = process.env.DIRECT_DB_HOST || "db.rotaract3192.org";
const BASIC_USER = process.env.DIRECT_DB_USER || "rotaract-admin";
const BASIC_PASS = process.env.DIRECT_DB_PASS || "Y9#M2!qR7@Lp8Xv$5NtW";

function getAuthHeader(): string {
  return `Basic ${Buffer.from(`${BASIC_USER}:${BASIC_PASS}`).toString("base64")}`;
}

/**
 * Universal SQL literal escaping helper to prevent SQL injection attacks.
 * Wraps strings in single quotes with single quotes doubled (' -> '').
 * Numbers and booleans are converted to string literals without quotes.
 * Null/undefined return "NULL".
 */
export function escapeSql(val: any): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") {
    if (!Number.isFinite(val)) return "NULL";
    return String(val);
  }
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  return `'${String(val).replace(/'/g, "''")}'`;
}

/**
 * Unquoted string escape helper for use inside LIKE / ILIKE '%...%' clauses
 */
export function escapeSqlLike(val: string | null | undefined): string {
  if (!val) return "";
  return String(val).replace(/'/g, "''").replace(/[%_]/g, "\\$&");
}

export async function executeSql<T = any>(sql: string): Promise<{ data: T[] | null; error: any }> {
  try {
    const res = await fetch(`https://${HOST}/api/platform/pg-meta/default/query`, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      return { data: null, error: { message: errText, status: res.status } };
    }

    const data = await res.json();
    if (data && typeof data === "object" && !Array.isArray(data)) {
      if ("error" in data || "message" in data || "code" in data) {
        return { data: null, error: data };
      }
    }

    return { data: Array.isArray(data) ? data : [data], error: null };
  } catch (err: any) {
    return { data: null, error: { message: err?.message || String(err) } };
  }
}
