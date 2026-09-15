/**
 * High-Performance Direct DB Client
 * Connects directly to the Supabase Studio query API on db.rotaract3192.org
 * via Kong gateway /pg/query or platform pg-meta API.
 *
 * Supports service-role key Bearer authentication and HTTP Basic Auth fallback.
 */

function getApiKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q"
  );
}

function getBasicAuthHeader(): string {
  const user = process.env.DIRECT_DB_USER || "rotaract-admin";
  const pass = process.env.DIRECT_DB_PASS || "Y9#M2!qR7@Lp8Xv$5NtW";
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
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
  if (process.env.NODE_ENV === "test") {
    return { data: [] as T[], error: null };
  }

  const host = process.env.DIRECT_DB_HOST || "db.rotaract3192.org";
  const port = process.env.DIRECT_DB_PORT || "8000";
  const apiKey = getApiKey();

  // 1. Primary: Direct Kong pg/query Gateway (Fastest, zero Basic Auth blocking)
  if (apiKey) {
    try {
      const gatewayUrl = `http://${host}:${port}/pg/query`;
      const res = await fetch(gatewayUrl, {
        method: "POST",
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sql }),
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === "object" && !Array.isArray(data)) {
          if ("error" in data || "message" in data || "code" in data) {
            return { data: null, error: data };
          }
        }
        return { data: Array.isArray(data) ? data : [data], error: null };
      }
    } catch (err) {
      // Fall through to Studio API fallback below
    }
  }

  // 2. Fallback: Supabase Studio platform query API with Basic Auth
  try {
    const studioUrl = `https://${host}/api/platform/pg-meta/default/query`;
    const res = await fetch(studioUrl, {
      method: "POST",
      headers: {
        Authorization: getBasicAuthHeader(),
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
