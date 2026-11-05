const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

router.get("/get-all-tat", async (req, res) => {
  const { data, error } = await supabase.from("tat_master").select("*");
  if (error) {
    console.error("Internal Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
  res.status(200).json(data);
});

router.get("/get-tat-by-id", async (req, res) => {
  const { data, error } = await supabase
    .from("tat_master")
    .select("*")
    .eq("ticket_id", req.query.ticket_id)
    .eq("ticket_type", "support");

  if (error) {
    console.error("Internal Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
  res.json(data);
});

router.get("/get-all-pms-tat", async (req, res) => {
  const { data, error } = await supabase.from("pmstat_master").select("*");
  if (error) {
    console.error("Internal Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
  res.status(200).json(data);
});

module.exports = router;
