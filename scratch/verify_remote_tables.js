const { createClient } = require("@supabase/supabase-js");

const url = "https://db.rotaract3192.org";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q";

const supabase = createClient(url, serviceKey);

async function verifyAllTables() {
  console.log("Verifying RotaSphere remote tables on https://db.rotaract3192.org ...\n");

  const tables = [
    "rotasphere_profiles",
    "rotasphere_clubs",
    "rotasphere_categories",
    "rotasphere_events",
    "rotasphere_ticket_tiers",
    "rotasphere_tickets",
    "rotasphere_orders",
    "rotasphere_order_items",
    "rotasphere_registrations",
    "rotasphere_check_ins",
    "rotasphere_payouts",
    "rotasphere_system_settings",
    "rotasphere_broadcast_announcements"
  ];

  const results = [];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase.from(table).select("*", { count: "exact", head: true });
      if (error) {
        results.push({ Table: table, Status: "❌ FAILED", Message: error.message });
      } else {
        results.push({ Table: table, Status: "✅ VERIFIED & LIVE", Records: count ?? 0 });
      }
    } catch (err) {
      results.push({ Table: table, Status: "❌ ERROR", Message: err.message });
    }
  }

  console.table(results);
}

verifyAllTables();
