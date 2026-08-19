/**
 * Platform Feature Flags Service
 * Reads real-time toggles from Postgres database
 */

import { executeSql, escapeSql } from "@/lib/db/directDb";

export async function isFeatureEnabled(flagName: string, defaultValue: boolean = true): Promise<boolean> {
  try {
    const { data } = await executeSql(`
      SELECT is_enabled FROM platform_feature_flags
      WHERE name = ${escapeSql(flagName)}
      LIMIT 1;
    `);

    if (data && data.length > 0) {
      return Boolean(data[0].is_enabled);
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
}
