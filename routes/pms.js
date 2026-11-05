var express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
require("dotenv").config();
const supabase = require("../supabase");

//Get All PMS/Assets
router.get("/get-all-pms", async (req, res) => {
  try {
    const { data: fetch, error } = await supabase
      .from("pms_master")
      .select("*");

    res.json(fetch);
    console.log("Triggered /get-all-pms");
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Archive PMS/Assets
router.post("/archive-device", async (req, res) => {
  try {
    const { pms_id, updated_by } = req.body;

    await supabase
      .from("pms_master")
      .update({ is_active: false, updated_by })
      .eq("pms_id", pms_id);

    res.status(200).json({ message: "successfully" });
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Un-Archive PMS/Assets
router.post("/un-archive-device", async (req, res) => {
  try {
    const { pms_id, updated_by } = req.body;

    await supabase
      .from("pms_master")
      .update({ is_active: true, updated_by })
      .eq("pms_id", pms_id);

    res.status(200).json({ message: "successfully" });
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Get PMS/Assets Logs by ID
router.get("/get-logs", async (req, res) => {
  try {
    console.log("/get-logs for pms was triggered");

    const { data: result, error } = await supabase
      .from("pms_logs")
      .select("*")
      .eq("pms_id", req.query.id);

    res.json(result);
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
  }
});

//Add Computer/Desktop
router.post("/add-computer", async (req, res) => {
  try {
    const currentTimestamp = new Date();
    const {
      tag_id,
      department,
      assign_to,
      pass_word,
      ip_address,
      processor,
      memory,
      storage,
      monitor_model,
      monitor_serial,
      pms_date,
      date_purchased,
      msl,
      wl,
      gpu,
      description,
      created_by,
      assigned_location,
    } = req.body;

    const { data: add, error } = await supabase
      .from("pms_master")
      .insert({
        tag_id,
        department,
        assign_to,
        pass_word,
        ip_address,
        processor,
        memory,
        storage,
        monitor_model,
        monitor_serial,
        pms_date,
        date_purchased,
        msl,
        wl,
        gpu,
        description,
        created_by,
        created_at: currentTimestamp,
        assigned_location,
        pms_category: "desktop",
        is_active: true,
      })
      .select("pms_id")
      .single();

    if (error) {
      console.log("INSERT ERROR: ", error);
      return res.status(500).json({ error: "Failed to add computer" });
    }

    await supabase.from("pms_logs").insert({
      tag_id,
      changes_made: `New Computer added by ${created_by}`,
      created_by,
      created_at: currentTimestamp,
      pms_id: add.pms_id,
    });

    res.json(200);
    console.log("triggered /add-computer");
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
  }
});

//Get All Computer/Desktop
router.get("/get-computers", async (req, res) => {
  try {
    const { data: all, error } = await supabase
      .from("pms_master")
      .select("*")
      .eq("pms_category", "desktop");

    res.status(200).json(all);
    console.log("Triggered /get-computers");
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Get Computer/Desktop by ID
router.get("/get-computer-by-id", async (req, res) => {
  try {
    const { data: get, error } = await supabase
      .from("pms_master")
      .select("*")
      .eq("pms_id", req.query.pms_id)
      .single();

    res.json(get);
    console.log("Triggered /get-computer-by-id");
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Update Computer/Desktop
router.post("/update-computer", async (req, res) => {
  try {
    const currentTimestamp = new Date();
    const {
      pms_id,
      tag_id,
      department,
      assign_to,
      pass_word,
      ip_address,
      processor,
      memory,
      storage,
      monitor_model,
      monitor_serial,
      pms_date,
      gpu,
      date_purchased,
      windows_license,
      microsoft_license,
      description,
      assigned_location,
      updated_by,
      changes_made,
    } = req.body;

    await supabase
      .from("pms_master")
      .update({
        tag_id,
        department,
        assign_to,
        pass_word,
        ip_address,
        processor,
        memory,
        storage,
        gpu,
        monitor_model,
        monitor_serial,
        pms_date,
        date_purchased,
        msl: microsoft_license,
        wl: windows_license,
        description,
        assigned_location,
        updated_by,
        updated_at: currentTimestamp,
      })
      .eq("pms_id", pms_id);

    await supabase.from("pms_logs").insert({
      pms_id,
      tag_id,
      created_by: updated_by,
      created_at: currentTimestamp,
      changes_made,
    });

    res.status(200).json({ message: "Updated successfully" });
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Delete Computer/Desktop
router.post("/delete-computer", async (req, res) => {
  const { pms_id, tag_id, created_by } = req.body;
  try {
    await supabase.from("pms_logs").insert({
      pms_id,
      tag_id,
      created_by,
      created_at: new Date(),
      changes_made: `Desktop ${tag_id} deleted by ${created_by}`,
    });

    await supabase.from("pms_master").delete().eq("pms_id", pms_id);

    console.log(`${created_by} deleted asset ${tag_id} successfully`);
    res.status(200).json({ message: "Deleted asset successfully" });
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Add Laptop
router.post("/add-laptop", async (req, res) => {
  try {
    const currentTimestamp = new Date();
    const {
      tag_id,
      department,
      assign_to,
      pass_word,
      ip_address,
      model,
      serial,
      date_purchased,
      wl,
      msl,
      processor,
      memory,
      storage,
      pms_date,
      description,
      created_by,
      assigned_location,
    } = req.body;

    const { data: add, error } = await supabase
      .from("pms_master")
      .insert({
        tag_id,
        department,
        assign_to,
        pass_word,
        ip_address,
        model,
        serial,
        processor,
        memory,
        storage,
        date_purchased,
        wl,
        msl,
        pms_date,
        description,
        created_by,
        created_at: currentTimestamp,
        assigned_location,
        pms_category: "laptop",
        is_active: true,
      })
      .select("pms_id")
      .single();

    await supabase.from("pms_logs").insert({
      tag_id,
      changes_made: `New Laptop added by ${created_by}`,
      created_by,
      created_at: currentTimestamp,
      pms_id: add.pms_id,
    });

    res.json(200);
    console.log("triggered /add-laptop");
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
  }
});

//Get All Laptop
router.get("/get-laptop", async (req, res) => {
  try {
    const { data: all, error } = await supabase
      .from("pms_master")
      .select("*")
      .eq("pms_category", "laptop");

    res.status(200).json(all);
    console.log("Triggered /get-laptop");
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Get Laptop by ID
router.get("/get-laptop-by-id", async (req, res) => {
  try {
    const { data: get, error } = await supabase
      .from("pms_master")
      .select("*")
      .eq("pms_id", req.query.pms_id)
      .single();

    res.json(get);
    console.log("Triggered /get-laptop-by-id");
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Update Laptop
router.post("/update-laptop", async (req, res) => {
  try {
    const currentTimestamp = new Date();
    const {
      pms_id,
      tag_id,
      department,
      assign_to,
      pass_word,
      ip_address,
      model,
      serial,
      processor,
      memory,
      storage,
      date_purchased,
      microsoft_license,
      windows_license,
      pms_date,
      description,
      assigned_location,
      updated_by,
      changes_made,
    } = req.body;

    await supabase
      .from("pms_master")
      .update({
        tag_id,
        department,
        assign_to,
        pass_word,
        ip_address,
        model,
        serial,
        processor,
        memory,
        storage,
        date_purchased,
        wl: windows_license,
        msl: microsoft_license,
        pms_date,
        description,
        assigned_location,
        updated_by,
        updated_at: currentTimestamp,
      })
      .eq("pms_id", pms_id);

    await supabase.from("pms_logs").insert({
      pms_id,
      tag_id,
      created_by: updated_by,
      created_at: currentTimestamp,
      changes_made,
    });

    res.status(200).json({ message: "Updated successfully" });
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Add Printer
router.post("/add-printer", async (req, res) => {
  try {
    const currentTimestamp = new Date();
    const {
      tag_id,
      department,
      assign_to,
      ip_address,
      model,
      serial,
      pms_date,
      date_purchased,
      description,
      created_by,
      assigned_location,
    } = req.body;

    const { data: add, error } = await supabase
      .from("pms_master")
      .insert({
        tag_id,
        department,
        assign_to,
        ip_address,
        model,
        serial,
        pms_date,
        date_purchased,
        description,
        created_by,
        created_at: currentTimestamp,
        assigned_location,
        pms_category: "printer",
        is_active: true,
      })
      .select("pms_id")
      .single();

    await supabase.from("pms_logs").insert({
      tag_id,
      changes_made: `New Printer added by ${created_by}`,
      created_by,
      created_at: currentTimestamp,
      pms_id: add.pms_id,
    });

    res.json(200);
    console.log("triggered /add-printer");
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
  }
});

//Get All Printer
router.get("/get-printer", async (req, res) => {
  try {
    const { data: all, error } = await supabase
      .from("pms_master")
      .select("*")
      .eq("pms_category", "printer");

    res.status(200).json(all);
    console.log("Triggered /get-printer");
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Get Printer by ID
router.get("/get-printer-by-id", async (req, res) => {
  try {
    const { data: get, error } = await supabase
      .from("pms_master")
      .select("*")
      .eq("pms_id", req.query.pms_id)
      .single();

    res.json(get);
    console.log("Triggered /get-printer-by-id");
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Update Printer
router.post("/update-printer", async (req, res) => {
  try {
    const currentTimestamp = new Date();
    const {
      pms_id,
      tag_id,
      department,
      assign_to,
      ip_address,
      model,
      serial,
      pms_date,
      description,
      assigned_location,
      updated_by,
      changes_made,
    } = req.body;

    await supabase
      .from("pms_master")
      .update({
        tag_id,
        department,
        assign_to,
        ip_address,
        model,
        serial,
        pms_date,
        description,
        assigned_location,
        updated_by,
        updated_at: currentTimestamp,
      })
      .eq("pms_id", pms_id);

    await supabase.from("pms_logs").insert({
      pms_id,
      tag_id,
      created_by: updated_by,
      created_at: currentTimestamp,
      changes_made,
    });

    res.status(200).json({ message: "Updated successfully" });
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//PMS Lock
router.post("/lock", async (req, res) => {
  try {
    const { pms_id, lock_by } = req.body;

    const { data: asset } = await supabase
      .from("pms_master")
      .select("*")
      .eq("pms_id", pms_id)
      .single();

    if (asset.is_lock && asset.lock_by && asset.lock_by !== lock_by) {
      return res.status(403).json({
        success: false,
        message: `${asset.lock_by} is currently reviewing this asset.`,
      });
    }

    await supabase
      .from("pms_master")
      .update({ is_lock: true, lock_by, lock_at: new Date() })
      .eq("pms_id", pms_id);

    res.json({
      success: true,
      message: lock_by + " is currently reviewing this asset",
    });
  } catch (err) {
    console.error("LOCK ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

//PMS Unlock
router.post("/unlock", async (req, res) => {
  try {
    const { pms_id, lock_by } = req.body;

    if (!pms_id || !lock_by) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    const { data: asset } = await supabase
      .from("pms_master")
      .select("lock_by")
      .eq("pms_id", pms_id)
      .single();

    if (asset.lock_by !== lock_by) {
      return res.json({ success: false, message: "Not your lock" });
    }

    await supabase
      .from("pms_master")
      .update({ is_lock: false, lock_by: null, lock_at: null })
      .eq("pms_id", pms_id);

    res.json({ success: true, message: "Asset unlocked" });
  } catch (err) {
    console.error("UNLOCK ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

//Get All Assets
router.get("/get-all-assets", async (req, res) => {
  try {
    const { data: assets, error } = await supabase
      .from("pms_master")
      .select("*");

    res.json(assets);
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Turnaround Time
router.post("/turnaround-time", async (req, res) => {
  try {
    const {
      tat,
      user_id,
      pmsticket_id,
      user_name,
      pms_category,
      ticket_type,
      ticket_created_at,
      created_by,
      assigned_location,
    } = req.body;

    await supabase.from("pmstat_master").insert({
      tat,
      user_id,
      pmsticket_id,
      user_name,
      assigned_location,
      pms_category,
      created_by,
      ticket_created_at,
      ticket_type,
      created_at: new Date(),
    });

    console.log(
      `${created_by} TAT "Ticket: ${pmsticket_id}" saved successfully`,
    );
    res.status(200).json({ message: "TAT saved successfully" });
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
  }
});

module.exports = router;
