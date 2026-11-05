var express = require("express");
const router = express.Router();
require("dotenv").config();
const nodemailer = require("nodemailer");

const supabase = require("../supabase.js");

//Add Announcement
router.post("/add-anc", async (req, res) => {
  const currentTimestamp = new Date();
  const { announcements, created_by, announcementTitle, location } = req.body;

  try {
    // Send email to all users
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        secure: false,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASS,
        },
        tls: { rejectUnauthorized: false },
      });

      const { data: allHdEmails } = await supabase
        .from("users_master")
        .select("emp_email")
        .eq("emp_tier", "user")
        .eq("emp_location", location);

      const email = allHdEmails.map((u) => u.emp_email);

      var content =
        "Good Day, <br><br>" +
        `${announcementTitle}<br>` +
        `${announcements}<br><br>`;
      var end = "Thank you for understanding. <br><br>";
      var footer = "Best regards,<br> Lepanto Helpdesk System<br>";
      var privacy =
        '<br><p style="color:gray;font-size:12px">Privacy Notice: </p>' +
        '<p style="color:gray;font-size:12px">The content of this email is intended for the person ' +
        "or entity to which it is addressed only. This email may contain confidential information. If you are not the person " +
        "to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly " +
        "prohibited.</p>";

      const ansemail = {
        from: process.env.EMAIL,
        to: email,
        subject: `Help Desk System Notification - Announcement`,
        html: content + end + footer + privacy,
      };

      await transporter.sendMail(ansemail);
      console.log("ANC EMAIL SENT SUCCESSFULLY");
    } catch (err) {
      console.log("/announcements UNABLE TO SEND EMAIL TO ALL USERS!", err);
    }

    // Insert announcement
    const { data: add, error } = await supabase
      .from("announcements_master")
      .insert({
        announcements,
        created_by,
        announcementTitle,
        is_active: true,
        created_at: currentTimestamp,
      })
      .select("announcements_id")
      .single();

    // Insert to logs
    await supabase.from("announcements_logs").insert({
      announcements_id: add.announcements_id,
      changes_made: `${created_by} has added an announcement.`,
      created_at: currentTimestamp,
      created_by: created_by,
    });

    res.json(200);
    console.log("triggered /add-anc");
  } catch (err) {
    console.log("INTERNAL ERROR UNABLE TO PUT ANNOUNCEMENT: ", err);
  }
});

router.get("/get-all-anc", async (req, res) => {
  try {
    const { data: fetchall, error } = await supabase
      .from("announcements_master") // ✅ make sure this matches your actual table name
      .select("*");

    console.log("fetchall: ", fetchall); // add this line temporarily
    console.log("error: ", error); // add this line temporarily

    res.json(fetchall);
    console.log("triggered /get-all-anc");
  } catch (err) {
    console.log("INTERNAL ERROR UNABLE TO FETCH ALL ANC: ", err);
  }
});
//Update Announcement
router.post("/update-anc", async (req, res) => {
  const currentTimestamp = new Date();
  try {
    const { announcement_id, announcements, updated_by } = req.body;

    const { data: oldanc } = await supabase
      .from("announcements_master")
      .select("announcements")
      .eq("announcements_id", announcement_id)
      .single();

    await supabase
      .from("announcements_master")
      .update({
        updated_at: currentTimestamp,
        announcements,
        updated_by,
      })
      .eq("announcements_id", announcement_id);

    await supabase.from("announcements_logs").insert({
      announcements_id: announcement_id,
      changes_made: `${updated_by} has edited announcement. OLD:${oldanc.announcements} to NEW:${announcements}`,
      created_at: currentTimestamp,
      created_by: updated_by,
    });

    res.json(200);
    console.log("triggered /update-anc");
  } catch (err) {
    console.log("INTERNAL ERROR UNABLE TO UPDATE: ", err);
  }
});

//Reactivate Announcement
router.post("/reactivate-anc", async (req, res) => {
  const currentTimestamp = new Date();
  try {
    const { announcement_id, updated_by } = req.body;

    await supabase
      .from("announcements_master")
      .update({
        updated_at: currentTimestamp,
        is_active: true, // changed from 1 to true
        updated_by,
      })
      .eq("announcements_id", announcement_id);

    await supabase.from("announcements_logs").insert({
      announcements_id: announcement_id,
      changes_made: `${updated_by} has re activated announcement.`,
      created_at: currentTimestamp,
      created_by: updated_by,
    });

    res.json(200);
    console.log("triggered /reactivate-anc");
  } catch (err) {
    console.log("INTERNAL ERROR UNABLE TO UPDATE: ", err);
  }
});

//De-Activate Announcement
router.post("/delete-anc", async (req, res) => {
  const currentTimestamp = new Date();
  try {
    const { announcement_id, updated_by } = req.body;

    await supabase
      .from("announcements_master")
      .update({
        is_active: false, // changed from 0 to false
        updated_at: currentTimestamp,
        updated_by: updated_by,
      })
      .eq("announcements_id", announcement_id);

    await supabase.from("announcements_logs").insert({
      announcements_id: announcement_id,
      changes_made: `${updated_by} has deleted announcement.`,
      created_at: currentTimestamp,
      created_by: updated_by,
    });

    res.json(200);
    console.log("triggered /delete-anc");
  } catch (err) {
    console.log("INTERNAL ERROR UNABLE TO DELETE: ", err);
  }
});

//Delete Announcement Permanently
router.post("/perma-delete-anc", async (req, res) => {
  try {
    const currentTimestamp = new Date();
    const { announcement_id, updated_by } = req.body;

    await supabase.from("announcements_logs").insert({
      announcements_id: announcement_id,
      changes_made: `${updated_by} has permanently deleted announcement.`,
      created_at: currentTimestamp,
      created_by: updated_by,
    });

    await supabase
      .from("announcements_master")
      .delete()
      .eq("announcements_id", announcement_id);

    res.json(200);
    console.log("triggered /perma-delete-anc");
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
  }
});

module.exports = router;
