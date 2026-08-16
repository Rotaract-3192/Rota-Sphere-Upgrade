/**
 * High-Performance Direct DB Client
 * Connects directly to the Supabase Studio query API on db.rotaract3192.org
 * with HTTP Basic Auth and executes queries with zero 401/404 issues.
 */

const HOST = "db.rotaract3192.org";
const BASIC_USER = "rotaract-admin";
const BASIC_PASS = "Y9#M2!qR7@Lp8Xv$5NtW";

const authHeader = `Basic ${Buffer.from(`${BASIC_USER}:${BASIC_PASS}`).toString("base64")}`;

export async function executeSql<T = any>(sql: string): Promise<{ data: T[] | null; error: any }> {
  try {
    const res = await fetch(`https://${HOST}/api/platform/pg-meta/default/query`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
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
