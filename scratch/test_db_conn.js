const { createClient } = require("@supabase/supabase-js");

const url = "https://db.rotaract3192.org";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q";

const supabase = createClient(url, serviceKey);

async function testConnection() {
  try {
    console.log("Testing connection to https://db.rotaract3192.org ...");
    const { data, error } = await supabase.from("profiles").select("count", { count: "exact", head: true });
    if (error) {
      console.log("Response:", error.message);
    } else {
      console.log("SUCCESS! Connection established. Profiles count:", data);
    }
  } catch (err) {
    console.error("Error connecting:", err);
  }
}

testConnection();
