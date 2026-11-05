var express = require("express");
const router = express.Router();
require("dotenv").config();
const supabase = require("../supabase");

//Add Knowledgebase
router.post("/add-knowledgebase", async (req, res) => {
  try {
    const { kb_title, kb_desc, kb_category, created_by } = req.body;

    const currentTimestamp = new Date();

    await supabase.from("knowledgebase_master").insert({
      kb_title,
      kb_desc,
      kb_category,
      created_by,
      created_at: currentTimestamp,
      is_active: true, // changed from 1 to true
    });

    res.json(200);
    console.log("Triggered add-knowledgebase route");
  } catch (err) {
    console.error("INTERNAL ERROR :", err);
  }
});

//Get all Knowledgebase
router.get("/all-knowledgebase", async (req, res) => {
  try {
    const { data: knowledgebase, error } = await supabase
      .from("knowledgebase_master")
      .select("*");

    res.json(knowledgebase);
    console.log("Triggered all-knowledgebase");
  } catch (err) {
    console.error("Error fetching knowledgebase:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Update Knowledgebase
router.post("/update-knowledgebase", async (req, res) => {
  try {
    const { kb_id, kb_title, kb_desc, kb_category, updated_by } = req.body;

    const currentTimestamp = new Date();

    await supabase
      .from("knowledgebase_master")
      .update({
        kb_title,
        kb_desc,
        kb_category,
        updated_by: updated_by,
        updated_at: currentTimestamp,
      })
      .eq("kb_id", kb_id);

    res.json(200);
    console.log("Triggered update-knowledgebase route");
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Archive Knowledgebase
router.post("/archive-knowledgebase", async (req, res) => {
  try {
    const { kb_id, updated_by } = req.body;
    const currentTimestamp = new Date();

    await supabase
      .from("knowledgebase_master")
      .update({
        is_active: false, // changed from 0 to false
        updated_at: currentTimestamp,
        updated_by: updated_by,
      })
      .eq("kb_id", kb_id);

    res.json(200);
    console.log("Triggered archive-knowledgebase route");
  } catch (err) {
    console.error("Error archiving knowledgebase:", err);
  }
});

//Un-Archive Knowledgebase
router.post("/un-archive-knowledgebase", async (req, res) => {
  try {
    const { kb_id, updated_by } = req.body;
    const currentTimestamp = new Date();

    await supabase
      .from("knowledgebase_master")
      .update({
        is_active: true, // changed from 1 to true
        updated_at: currentTimestamp,
        updated_by: updated_by,
      })
      .eq("kb_id", kb_id);

    res.json(200);
    console.log("Triggered un-archive-knowledgebase route");
  } catch (err) {
    console.error("Error un-archiving knowledgebase:", err);
  }
});

//Delete Knowledgebase
router.post("/delete-knowledgebase", async (req, res) => {
  try {
    const { kb_id } = req.body;

    await supabase.from("knowledgebase_master").delete().eq("kb_id", kb_id);

    res.json(200);
    console.log("Triggered delete-knowledgebase route");
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
  }
});

module.exports = router;
