const { createClient } = require("@supabase/supabase-js");

const url = "https://db.rotaract3192.org";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q";

const supabase = createClient(url, serviceKey);

async function testFull() {
  const { data, error } = await supabase.from("rotasphere_events").select("*");
  console.log("Data:", data);
  console.log("Error:", JSON.stringify(error, null, 2));
}

testFull();
