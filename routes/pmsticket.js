var express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();
const multer = require("multer");
require("dotenv").config();
const supabase = require("../supabase");

const DIR = "./esignatures";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });

const signatureFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const uploadSignature = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: signatureFileFilter,
});

function generatePmsTicketId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PMS${randomPart}`;
}

// Create Ticket
router.post("/create-ticket-user", async (req, res) => {
  const currentTimestamp = new Date();
  try {
    const { tag_id, Description, assigned_location, created_by, user_id } =
      req.body;

    const { data: empInfo } = await supabase
      .from("users_master")
      .select("*")
      .eq("user_id", user_id)
      .single();

    const Fullname =
      empInfo.emp_FirstName.charAt(0).toUpperCase() +
      empInfo.emp_FirstName.slice(1).toLowerCase();

    const { data: existingTickets } = await supabase
      .from("pmsticket_master")
      .select("pmsticket_id");

    const existingSet = new Set(existingTickets.map((t) => t.pmsticket_id));

    let pmsticket_id;
    let attempts = 0;
    do {
      pmsticket_id = generatePmsTicketId();
      attempts++;
      if (attempts > 10) {
        return res
          .status(500)
          .json({ error: "Failed to generate a unique ticket ID" });
      }
    } while (existingSet.has(pmsticket_id));

    await supabase.from("pmsticket_master").insert({
      pmsticket_id,
      pms_status: "open",
      pmsticket_for: created_by,
      assigned_location,
      tag_id,
      description: Description,
      created_by,
      created_at: currentTimestamp,
      is_active: true,
    });

    await supabase.from("pmsticket_logs").insert({
      pmsticket_id,
      tag_id,
      created_by,
      created_at: currentTimestamp,
      changes_made: `User ${created_by} submitted the ticket, Ticket ID: ${pmsticket_id}`,
    });

    console.log("Created a ticket successfully by " + created_by);

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        secure: false,
        auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS },
        tls: { rejectUnauthorized: false },
      });

      if (empInfo.emp_tier === "helpdesk") {
        return res
          .status(200)
          .json({
            message: "Ticket created successfully by HD, no email sent",
          });
      }

      if (empInfo.emp_tier === "user") {
        const { data: hdUsers } = await supabase
          .from("users_master")
          .select("emp_email")
          .eq("emp_tier", "helpdesk");

        const hdEmail = hdUsers.map((u) => u.emp_email);

        var privacy =
          '<br><p style="color:gray;font-size:12px">Privacy Notice: </p>' +
          '<p style="color:gray;font-size:12px">The content of this email is intended for the person or entity to which it is addressed only.</p>';

        var start =
          "Good Day, <br><br>" +
          `<b>PMS Ticket Number: </b>${pmsticket_id} <br>` +
          `<b>TagID: </b> ${tag_id} <br>` +
          `<b>Created By: </b> ${created_by} <br>` +
          `<b>Description: </b> ${Description} <br><br>`;

        var body = `You may access the ticket via <a href=${process.env.REACT_CLIENT}/view-pms-hd-ticket?id=${pmsticket_id}>Click here</a><br><br>`;
        var end = "Thank you.<br><br>";
        var footer = "Best regards,<br> Lepanto Helpdesk System";

        var useremail =
          `Hello ${Fullname},<br><br>` +
          `Thank you for submitting a PMS ticket.<br>` +
          `<b>PMS Ticket Number: </b>${pmsticket_id} <br>` +
          `<b>Tag ID: </b> ${tag_id} <br><br>` +
          "Best regards,<br> Lepanto Helpdesk System";

        await transporter.sendMail({
          from: process.env.EMAIL,
          to: hdEmail.join(","),
          subject: `Help Desk System Notification - New PMS Ticket Created`,
          html: start + body + end + footer + privacy,
        });

        await transporter.sendMail({
          from: process.env.EMAIL,
          to: empInfo.emp_email,
          subject: `Help Desk System Notification - New PMS Ticket Created`,
          html: useremail + privacy,
        });

        return res
          .status(200)
          .json({ message: "PMS Ticket created successfully and emails sent" });
      }
    } catch (err) {
      console.log("Unable to submit email: ", err);
      return res
        .status(200)
        .json({ message: "Ticket created but email failed" });
    }
  } catch (err) {
    console.error("Error creating ticket:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get PMS Ticket by ID
router.get("/pmsticket-by-id", async (req, res) => {
  try {
    const { data: ticket } = await supabase
      .from("pmsticket_master")
      .select("*")
      .eq("pmsticket_id", req.query.id)
      .single();

    res.json(ticket);
    console.log("triggered /pmsticket-by-id");
  } catch (err) {
    console.error("Error fetching ticket:", err);
    res.status(500).json({ error: "Failed to fetch ticket" });
  }
});

// Accept PMS Ticket
router.post("/update-accept-pmsticket", async (req, res) => {
  const currentTimestamp = new Date();
  try {
    const { user_id, pmsticket_id, pms_status, tag_id } = req.body;

    const { data: empInfo } = await supabase
      .from("users_master")
      .select("*")
      .eq("user_id", user_id)
      .single();

    const { data: ticketInfo } = await supabase
      .from("pmsticket_master")
      .select("*")
      .eq("pmsticket_id", pmsticket_id)
      .single();

    if (pms_status === "closed") {
      await supabase
        .from("pmsticket_master")
        .update({
          assigned_to: empInfo.user_name,
          updated_at: currentTimestamp,
          updated_by: empInfo.user_name,
          pms_status: "re-opened",
          is_reviewed: false,
        })
        .eq("pmsticket_id", pmsticket_id);

      await supabase.from("pmsticket_logs").insert({
        tag_id,
        created_at: currentTimestamp,
        created_by: empInfo.user_name,
        pmsticket_id,
        changes_made: `${empInfo.user_name} accepted closed ticket and re-opened it.`,
      });
    } else {
      await supabase
        .from("pmsticket_master")
        .update({
          assigned_to: empInfo.user_name,
          updated_at: currentTimestamp,
          updated_by: empInfo.user_name,
          pms_status: "assigned",
          is_reviewed: false,
        })
        .eq("pmsticket_id", pmsticket_id);
    }

    if (pms_status === "open" || pms_status === "resolved") {
      await supabase.from("pmsticket_logs").insert({
        pmsticket_id,
        tag_id: ticketInfo.tag_id,
        created_by: empInfo.user_name,
        created_at: currentTimestamp,
        changes_made: `${empInfo.user_name} accepted ${pms_status} ticket, Ticket ID: ${pmsticket_id}`,
      });
    }

    console.log(`Ticket ${pmsticket_id} accepted by ${empInfo.user_name}`);
    res.status(200).json({ message: "Ticket accepted" });
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update PMS Ticket
router.post("/update-pmsticket", async (req, res) => {
  const currentTimestamp = new Date();
  try {
    const {
      pmsticket_id,
      pms_status,
      description,
      updated_by,
      pmsticket_for,
      changes_made,
      assigned_location,
      ticket_for_UserId,
      assigned_to_UserId,
      assigned_to,
      CloseReason,
      tag_id,
    } = req.body;

    const { data: updateByInfo } = await supabase
      .from("users_master")
      .select("*")
      .eq("user_id", updated_by)
      .single();

    if (pms_status === "open") {
      await supabase
        .from("pmsticket_master")
        .update({ assigned_to: "" })
        .eq("pmsticket_id", pmsticket_id);
    } else if (assigned_to && assigned_to.trim() !== "") {
      await supabase
        .from("pmsticket_master")
        .update({
          assigned_to,
          updated_by: updateByInfo.user_name,
          updated_at: currentTimestamp,
        })
        .eq("pmsticket_id", pmsticket_id);
    }

    await supabase
      .from("pmsticket_master")
      .update({
        pms_status,
        tag_id,
        description,
        assigned_location,
        pmsticket_for,
        updated_at: currentTimestamp,
        updated_by: updateByInfo.user_name,
      })
      .eq("pmsticket_id", pmsticket_id);

    await supabase.from("pmsticket_logs").insert({
      pmsticket_id,
      tag_id,
      created_by: updateByInfo.user_name,
      created_at: currentTimestamp,
      changes_made,
    });

    console.log(
      `PMS Ticket ${pmsticket_id} updated by ${updateByInfo.user_name}`,
    );
    res.status(200).json({ message: "PMS Ticket updated successfully" });

    // Emails
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        secure: false,
        auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS },
        tls: { rejectUnauthorized: false },
      });

      var end = `Best regards,<br> Lepanto Helpdesk System`;
      var privacy =
        '<br><p style="color:gray;font-size:12px">Privacy Notice: </p><p style="color:gray;font-size:12px">Confidential.</p>';

      if (pms_status === "in-progress") {
        const { data: ticketForInfo } = await supabase
          .from("users_master")
          .select("*")
          .eq("user_id", ticket_for_UserId)
          .single();

        const Fullname =
          ticketForInfo.user_name.charAt(0).toUpperCase() +
          ticketForInfo.user_name.slice(1).toLowerCase();
        var body =
          `Good News! A support team member has started working on your PMS ticket.<br>` +
          `<b>PMS Ticket Number: </b>${pmsticket_id} <br>` +
          `<b>Tag ID: </b> ${tag_id} <br>` +
          `<b>Status: </b> ${pms_status} <br><br>`;

        await transporter.sendMail({
          from: process.env.EMAIL,
          to: ticketForInfo.emp_email,
          subject: `Help Desk System Notification - PMS Ticket Update`,
          html: `Hello ${Fullname},<br><br>` + body + end + privacy,
        });
      }

      if (pms_status === "resolved") {
        const { data: ticketForInfo } = await supabase
          .from("users_master")
          .select("*")
          .eq("user_id", ticket_for_UserId)
          .single();

        const Fullname =
          ticketForInfo.user_name.charAt(0).toUpperCase() +
          ticketForInfo.user_name.slice(1).toLowerCase();
        var body =
          `The scheduled PMS has been completed.<br>` +
          `<b>PMS Ticket Number: </b>${pmsticket_id} <br>` +
          `<b>Tag ID: </b> ${tag_id} <br><br>` +
          `Please close the ticket and upload your e-signature.<br>` +
          `<a href=${process.env.REACT_CLIENT}/view-pms-user-ticket?id=${pmsticket_id}>Click to view</a><br><br>`;

        await transporter.sendMail({
          from: process.env.EMAIL,
          to: ticketForInfo.emp_email,
          subject: `Help Desk System Notification - PMS Ticket Updated`,
          html: `Hello ${Fullname},<br><br>` + body + end + privacy,
        });

        await supabase
          .from("pmsticket_master")
          .update({ resolved_at: currentTimestamp })
          .eq("pmsticket_id", pmsticket_id);
      }

      if (pms_status === "re-opened") {
        const { data: assignedToInfo } = await supabase
          .from("users_master")
          .select("*")
          .eq("user_id", assigned_to_UserId)
          .single();

        const HDFullname =
          assignedToInfo.user_name.charAt(0).toUpperCase() +
          assignedToInfo.user_name.slice(1).toLowerCase();
        var body =
          `PMS ticket has been re-opened.<br>` +
          `<b>PMS Ticket Number: </b>${pmsticket_id} <br>` +
          `<b>Tag ID: </b> ${tag_id} <br><br>`;

        await transporter.sendMail({
          from: process.env.EMAIL,
          to: assignedToInfo.emp_email,
          subject: `Help Desk System Notification - PMS Ticket Updated`,
          html: `Hello ${HDFullname}<br><br>` + body + end + privacy,
        });

        await supabase
          .from("pmsticket_master")
          .update({ is_reviewed: false })
          .eq("pmsticket_id", pmsticket_id);
      }

      if (pms_status === "closed") {
        const { data: assignedToInfo } = await supabase
          .from("users_master")
          .select("*")
          .eq("user_id", assigned_to_UserId)
          .single();

        const HDFullname =
          assignedToInfo.user_name.charAt(0).toUpperCase() +
          assignedToInfo.user_name.slice(1).toLowerCase();
        var body =
          `PMS ticket has been closed.<br>` +
          `<b>PMS Ticket Number: </b>${pmsticket_id} <br>` +
          `<b>Tag ID: </b> ${tag_id} <br>` +
          `<b>Reason: </b>${CloseReason}<br><br>`;

        await transporter.sendMail({
          from: process.env.EMAIL,
          to: assignedToInfo.emp_email,
          subject: `Help Desk System Notification - PMS Ticket Updated`,
          html: `Hello ${HDFullname}<br><br>` + body + end + privacy,
        });

        await supabase
          .from("pmsticket_master")
          .update({ is_reviewed: false, closed_at: currentTimestamp })
          .eq("pmsticket_id", pmsticket_id);
      }
    } catch (err) {
      console.log("Unable to send email: ", err);
    }
  } catch (err) {
    console.error("Error updating ticket:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get All PMS Tickets
router.get("/get-all-pmsticket", async (req, res) => {
  try {
    const { data: alltickets } = await supabase
      .from("pmsticket_master")
      .select("*");

    res.json(alltickets);
    console.log("triggered /get-all-pmsticket");
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
  }
});

// Re-assign Ticket
router.post("/update-ticket-assigned", async (req, res) => {
  try {
    const currentTimestamp = new Date();
    const { assigned_to, updated_by, pmsticket_id, tag_id, pms_status } =
      req.body;

    const { data: updateByInfo } = await supabase
      .from("users_master")
      .select("*")
      .eq("user_id", updated_by)
      .single();

    await supabase
      .from("pmsticket_master")
      .update({
        assigned_to,
        pms_status,
        updated_by: updateByInfo.user_name,
        updated_at: currentTimestamp,
      })
      .eq("pmsticket_id", pmsticket_id);

    await supabase.from("pmsticket_logs").insert({
      pmsticket_id,
      tag_id,
      created_by: updateByInfo.user_name,
      created_at: currentTimestamp,
      changes_made: `${updateByInfo.user_name} assigned the ticket to ${assigned_to}`,
    });

    res.status(200).json({ message: "Ticket updated successfully" });

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        secure: false,
        auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS },
        tls: { rejectUnauthorized: false },
      });

      const { data: assignedToInfo } = await supabase
        .from("users_master")
        .select("*")
        .eq("user_name", assigned_to)
        .single();

      const { data: ticket } = await supabase
        .from("pmsticket_master")
        .select("*")
        .eq("pmsticket_id", pmsticket_id)
        .single();

      const HDFullname =
        assignedToInfo.user_name.charAt(0).toUpperCase() +
        assignedToInfo.user_name.slice(1).toLowerCase();

      await transporter.sendMail({
        from: process.env.EMAIL,
        to: assignedToInfo.emp_email,
        subject: `Help Desk System Notification - PMS Ticket Updated`,
        html:
          `Hello ${HDFullname}<br><br>PMS ticket ${pmsticket_id} has been assigned to you.<br>` +
          `<b>Tag ID: </b> ${ticket.tag_id} <br>` +
          `<b>Status: </b> ${pms_status} <br><br>` +
          `Best regards,<br> Lepanto Helpdesk System`,
      });
    } catch (err) {
      console.log("Unable to send email: ", err);
    }
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
  }
});

// Get Notes by PMS Ticket ID
router.get("/get-all-notes/:pmsticket_id", async (req, res) => {
  try {
    const { data: notes } = await supabase
      .from("pmsnotes_master")
      .select("*")
      .eq("pmsticket_id", req.params.pmsticket_id)
      .order("created_at", { ascending: true });

    res.json(notes);
    console.log("triggered /get-all-notes/:pmsticket_id");
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
  }
});

// Add Note (HD)
router.post("/note-hd-post", async (req, res) => {
  const currentTimestamp = new Date();
  try {
    const { notes, current_user, pmsticket_id, signature } = req.body;

    await supabase.from("pmsnotes_master").insert({
      note: notes,
      created_by: current_user,
      created_at: currentTimestamp,
      pmsticket_id,
      signature,
    });

    await supabase.from("pmsticket_logs").insert({
      pmsticket_id,
      tag_id: "",
      created_by: current_user,
      created_at: currentTimestamp,
      changes_made: `${current_user} placed a note "${notes}"`,
    });

    console.log(`${current_user} placed a note successfully`);
    res.status(200).json({ message: "Note placed successfully" });
  } catch (err) {
    console.log("Internal Error: ", err);
  }
});

// Add Note (User)
router.post("/note-post", upload.single("signature"), async (req, res) => {
  const currentTimestamp = new Date();
  try {
    const { notes, current_user, pmsticket_id } = req.body;

    await supabase.from("pmsnotes_master").insert({
      note: notes,
      created_by: current_user,
      created_at: currentTimestamp,
      pmsticket_id,
    });

    await supabase.from("pmsticket_logs").insert({
      pmsticket_id,
      tag_id: "",
      created_by: current_user,
      created_at: currentTimestamp,
      changes_made: `${current_user} placed a note "${notes}"`,
    });

    console.log(`${current_user} placed a note successfully`);
    res.status(200).json({ message: "Note placed successfully" });
  } catch (err) {
    console.error("Internal Error: ", err);
  }
});

// Add Note with Signature
router.post(
  "/note-post-signature",
  upload.single("signature"),
  async (req, res) => {
    const currentTimestamp = new Date();
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No signature file uploaded" });
      }

      const { notes, current_user, pmsticket_id, is_pms } = req.body;

      if (!notes || !current_user || !pmsticket_id) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      await supabase.from("pmsnotes_master").insert({
        note: notes,
        created_by: current_user,
        created_at: currentTimestamp,
        pmsticket_id,
        signature: req.file.path,
        is_pms: is_pms === "true",
      });

      await supabase
        .from("pmsticket_master")
        .update({ signature: req.file.path })
        .eq("pmsticket_id", pmsticket_id);

      await supabase.from("pmsticket_logs").insert({
        pmsticket_id,
        tag_id: "",
        created_by: current_user,
        created_at: currentTimestamp,
        changes_made: `${current_user} placed a note "${notes}"`,
      });

      console.log(`${current_user} placed a note with signature`);
      res
        .status(200)
        .json({ message: "Note added successfully", file: req.file.filename });
    } catch (err) {
      console.error("Internal Error: ", err);
      res
        .status(500)
        .json({ message: "Failed to add note", error: err.message });
    }
  },
);

// Set Notified True
router.post("/notified-true", async (req, res) => {
  try {
    const { pmsticket_id, user_id } = req.body;

    const { data: empInfo } = await supabase
      .from("users_master")
      .select("emp_tier")
      .eq("user_id", user_id)
      .single();

    if (empInfo.emp_tier === "helpdesk") {
      await supabase
        .from("pmsticket_master")
        .update({ is_notified: true })
        .eq("pmsticket_id", pmsticket_id);
    } else if (empInfo.emp_tier === "user") {
      await supabase
        .from("pmsticket_master")
        .update({ is_notifiedhd: true })
        .eq("pmsticket_id", pmsticket_id);
    }

    console.log("Triggered /notified-true");
    res.status(200).json({ message: "Updated notif", pmsticket_id });
  } catch (err) {
    console.log("Unable to update notification: ", err);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// Set Notified False
router.post("/update-notified-false", async (req, res) => {
  try {
    const { pmsticket_id, user_id } = req.body;

    const { data: empInfo } = await supabase
      .from("users_master")
      .select("emp_tier")
      .eq("user_id", user_id)
      .single();

    if (empInfo.emp_tier === "helpdesk") {
      await supabase
        .from("pmsticket_master")
        .update({ is_notifiedhd: false })
        .eq("pmsticket_id", pmsticket_id);
    } else if (empInfo.emp_tier === "user") {
      await supabase
        .from("pmsticket_master")
        .update({ is_notified: false })
        .eq("pmsticket_id", pmsticket_id);
    }

    console.log("Triggered /update-notified-false");
    res.status(200).json({ message: "Updated notif", pmsticket_id });
  } catch (err) {
    console.log("Unable to update notification: ", err);
  }
});

// Get Feedback by PMS Ticket ID
router.get("/get-all-feedback/:pmsticket_id", async (req, res) => {
  try {
    const { data: feedback } = await supabase
      .from("pmsreview_master")
      .select("*")
      .eq("pmsticket_id", req.params.pmsticket_id)
      .order("created_at", { ascending: true });

    res.json(feedback);
    console.log("triggered /get-all-feedback/:pmsticket_id");
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
  }
});

// Get All Feedback
router.get("/get-all-feedback", async (req, res) => {
  try {
    const { data: getAll } = await supabase
      .from("pmsreview_master")
      .select("*");

    res.status(200).json(getAll);
    console.log("Triggered /get-all-feedback");
  } catch (err) {
    console.error("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add Feedback
router.post("/feedback", async (req, res) => {
  const currentTimestamp = new Date();
  try {
    const { review, user_id, created_by, pmsticket_id, score } = req.body;

    await supabase.from("pmsreview_master").insert({
      review,
      user_id,
      created_at: currentTimestamp,
      created_by,
      pmsticket_id,
      score,
    });

    await supabase
      .from("pmsticket_master")
      .update({ is_reviewed: true })
      .eq("pmsticket_id", pmsticket_id);

    console.log(`${created_by} placed a feedback successfully`);
    res.json(200);
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
  }
});

// Delete and Re-add Feedback
router.post("/feedback-delete-by-id", async (req, res) => {
  try {
    const currentTimestamp = new Date();
    const { pmsticket_id, review, user_id, created_by, score } = req.body;

    await supabase
      .from("pmsreview_master")
      .delete()
      .eq("pmsticket_id", pmsticket_id);

    await supabase.from("pmsreview_master").insert({
      review,
      user_id,
      created_at: currentTimestamp,
      created_by,
      pmsticket_id,
      score,
    });

    await supabase
      .from("pmsticket_master")
      .update({ is_reviewed: true })
      .eq("pmsticket_id", pmsticket_id);

    console.log(`${created_by} placed a new feedback successfully`);
    res.status(200).json({ message: "Feedback saved successfully" });
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
  }
});

// Archive Ticket
router.post("/archive-ticket", async (req, res) => {
  try {
    const currentTimestamp = new Date();
    const { pmsticket_id, updated_by } = req.body;

    await supabase
      .from("pmsticket_master")
      .update({ is_active: false, updated_by })
      .eq("pmsticket_id", pmsticket_id);

    await supabase.from("pmsticket_logs").insert({
      pmsticket_id,
      created_by: updated_by,
      created_at: currentTimestamp,
      changes_made: `${updated_by} Archived this ticket`,
    });

    res.status(200).json({ message: "Ticket archived successfully" });
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
  }
});

// Un-Archive Ticket
router.post("/un-archive-ticket", async (req, res) => {
  try {
    const currentTimestamp = new Date();
    const { pmsticket_id, updated_by } = req.body;

    await supabase
      .from("pmsticket_master")
      .update({ is_active: true, updated_by })
      .eq("pmsticket_id", pmsticket_id);

    await supabase.from("pmsticket_logs").insert({
      pmsticket_id,
      created_by: updated_by,
      created_at: currentTimestamp,
      changes_made: `${updated_by} Un-Archived this ticket`,
    });

    res.status(200).json({ message: "Ticket un-archived successfully" });
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
  }
});

// Get All Tickets
router.get("/get-all-ticket", async (req, res) => {
  try {
    const { data: alltickets } = await supabase
      .from("pmsticket_master")
      .select("*");

    res.json(alltickets);
    console.log("triggered /get-all-ticket");
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
  }
});

// Lock Ticket
router.post("/lock", async (req, res) => {
  try {
    const { pmsticket_id, locked_by } = req.body;

    const { data: ticket } = await supabase
      .from("pmsticket_master")
      .select("*")
      .eq("pmsticket_id", pmsticket_id)
      .single();

    if (
      ticket.is_locked &&
      ticket.locked_by &&
      ticket.locked_by !== locked_by
    ) {
      return res.status(403).json({
        success: false,
        message: `${ticket.locked_by} is currently working on this ticket`,
      });
    }

    await supabase
      .from("pmsticket_master")
      .update({ is_locked: true, locked_by, locked_at: new Date() })
      .eq("pmsticket_id", pmsticket_id);

    res.json({ success: true, message: "Ticket locked" });
  } catch (err) {
    console.error("LOCK ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Unlock Ticket
router.post("/unlock", async (req, res) => {
  try {
    const { pmsticket_id, locked_by } = req.body || {};

    if (!pmsticket_id || !locked_by) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    await supabase
      .from("pmsticket_master")
      .update({ is_locked: false, locked_by: null, locked_at: null })
      .eq("pmsticket_id", pmsticket_id)
      .eq("locked_by", locked_by);

    res.json({ success: true, message: "Ticket unlocked" });
  } catch (err) {
    console.error("UNLOCK ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Send Notification to Review
router.post("/send-notification-review", async (req, res) => {
  try {
    const { ticket_for_id, pmsticket_id } = req.body;

    const { data: ticketForInfo } = await supabase
      .from("users_master")
      .select("*")
      .eq("user_id", ticket_for_id)
      .single();

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      secure: false,
      auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS },
      tls: { rejectUnauthorized: false },
    });

    const Fullname =
      ticketForInfo.user_name.charAt(0).toUpperCase() +
      ticketForInfo.user_name.slice(1).toLowerCase();

    var body =
      `Your PMS ticket (ID: ${pmsticket_id}) has been resolved.<br><br>` +
      `Please log in and close the ticket.<br>` +
      `<a href=${process.env.REACT_CLIENT}/view-pms-user-ticket?id=${pmsticket_id}>Submit Your Feedback Here.</a><br><br>` +
      `Best regards,<br> Lepanto Helpdesk System`;

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: ticketForInfo.emp_email,
      subject: `PMS Ticket #${pmsticket_id} Resolved – Awaiting Your Feedback`,
      html: `Hello ${Fullname},<br><br>` + body,
    });

    return res.status(200).json({ message: "Notification sent successfully" });
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get PMS Ticket Logs
router.get("/pmsticket-logs", async (req, res) => {
  try {
    const { data: logs } = await supabase
      .from("pmsticket_logs")
      .select("*")
      .eq("pmsticket_id", req.query.id);

    res.json(logs);
    console.log("/pmsticket-logs was triggered");
  } catch (err) {
    console.log("INTERNAL ERROR:", err);
  }
});

module.exports = router;
