const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const url = "https://db.rotaract3192.org";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q";

const supabase = createClient(url, serviceKey);

async function inspectAndCreate() {
  console.log("Checking existing tables on https://db.rotaract3192.org ...");

  // Check existing public tables
  const targetTables = [
    "profiles",
    "clubs",
    "categories",
    "events",
    "ticket_tiers",
    "tickets",
    "orders",
    "order_items",
    "registrations",
    "check_ins",
    "payouts",
    "system_settings",
    "broadcast_announcements"
  ];

  const statusMap = {};

  for (const table of targetTables) {
    const { error } = await supabase.from(table).select("*").limit(1);
    if (error && error.message.includes("does not exist")) {
      statusMap[table] = "NOT_CREATED_YET";
    } else if (error) {
      statusMap[table] = "ERROR: " + error.message;
    } else {
      statusMap[table] = "EXISTS";
    }
  }

  console.log("\n--- Table Status on db.rotaract3192.org ---");
  console.table(statusMap);
}

inspectAndCreate();
