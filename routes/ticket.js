// const express = require("express");
// const router = express.Router();
// const nodemailer = require("nodemailer");
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");
// require("dotenv").config();

// // Adjust to match how your supabase.js exports (e.g. `const { supabase } = require('../supabase')`)
// const supabase = require("../supabase");

// // ---------------- Helpers ----------------

// // Throws if Supabase returned an error, otherwise returns data
// const unwrap = ({ data, error }) => {
//   if (error) throw error;
//   return data;
// };

// const now = () => new Date().toISOString();

// const capitalize = (s = "") =>
//   s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

// const getUserById = async (user_id) =>
//   unwrap(
//     await supabase
//       .from("users_master")
//       .select("*")
//       .eq("user_id", user_id)
//       .maybeSingle(),
//   );

// const getUserByName = async (user_name) =>
//   unwrap(
//     await supabase
//       .from("users_master")
//       .select("*")
//       .eq("user_name", user_name)
//       .maybeSingle(),
//   );

// const getTicket = async (ticket_id) =>
//   unwrap(
//     await supabase
//       .from("ticket_master")
//       .select("*")
//       .eq("ticket_id", ticket_id)
//       .maybeSingle(),
//   );

// const updateTicket = async (ticket_id, fields) =>
//   unwrap(
//     await supabase
//       .from("ticket_master")
//       .update(fields)
//       .eq("ticket_id", ticket_id),
//   );

// const addLog = async (fields) =>
//   unwrap(await supabase.from("ticket_logs").insert(fields));

// // Email
// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   secure: false,
//   auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS },
//   tls: { rejectUnauthorized: false },
// });

// const END = "Best regards,<br> Lepanto Helpdesk System";
// const PRIVACY =
//   '<br><p style="color:gray;font-size:12px">Privacy Notice: </p>' +
//   '<p style="color:gray;font-size:12px">The content of this email is intended for the person ' +
//   "or entity to which it is addressed only. This email may contain confidential information. If you are not the person " +
//   "to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly " +
//   "prohibited.</p>";

// const sendMail = (to, subject, html) =>
//   transporter.sendMail({ from: process.env.EMAIL, to, subject, html });

// const UPDATE_SUBJECT = "Help Desk System Notification - Ticket Updated";

// // ---------------- Uploads (still local disk) ----------------

// const makeStorage = (dir) =>
//   multer.diskStorage({
//     destination: (req, file, cb) => cb(null, dir),
//     filename: (req, file, cb) => {
//       const original = file.originalname.replace(/\s+/g, "_");
//       cb(null, `${new Date().toISOString().replace(/[:.]/g, "-")}_${original}`);
//     },
//   });

// const upload = multer({
//   storage: makeStorage("./uploads"),
//   limits: { fileSize: 200 * 1024 * 1024 },
// });
// const uploadNotes = multer({
//   storage: makeStorage("./noteuploads"),
//   limits: { fileSize: 200 * 1024 * 1024 },
// });

// // ---------------- Ticket ID ----------------

// function generateTicketId() {
//   const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
//   let randomPart = "";
//   for (let i = 0; i < 6; i++)
//     randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
//   return `ST${randomPart}`;
// }

// async function generateUniqueTicketId() {
//   for (let i = 0; i < 10; i++) {
//     const id = generateTicketId();
//     const existing = unwrap(
//       await supabase
//         .from("ticket_master")
//         .select("ticket_id")
//         .eq("ticket_id", id)
//         .maybeSingle(),
//     );
//     if (!existing) return id;
//   }
//   return null;
// }

// // ---------------- Create ticket (USER) ----------------

// router.post(
//   "/create-ticket-user",
//   upload.array("Attachments"),
//   async (req, res) => {
//     const ts = now();
//     try {
//       const {
//         ticket_subject,
//         tag_id,
//         Description,
//         assigned_location,
//         created_by,
//         user_id,
//       } = req.body;

//       const empInfo = await getUserById(user_id);
//       if (!empInfo) return res.status(404).json({ error: "User not found" });
//       const Fullname = capitalize(empInfo.emp_FirstName);

//       const attachmentPath = req.files?.length
//         ? req.files.map((f) => f.path).join(";")
//         : null;

//       const ticket_id = await generateUniqueTicketId();
//       if (!ticket_id) {
//         return res
//           .status(500)
//           .json({
//             error: "Failed to generate a unique ticket ID, please try again.",
//           });
//       }

//       unwrap(
//         await supabase.from("ticket_master").insert({
//           ticket_id,
//           ticket_subject,
//           ticket_status: "open",
//           ticket_urgencyLevel: "low",
//           ticket_category: "",
//           ticket_SubCategory: "",
//           ticket_for: created_by,
//           assigned_location,
//           tag_id,
//           Description,
//           created_by,
//           created_at: ts,
//           Attachments: attachmentPath,
//           is_active: true,
//         }),
//       );

//       await addLog({
//         ticket_id,
//         ticket_status: "open",
//         created_by,
//         time_date: ts,
//         changes_made: `User ${created_by} submmited the ticket, Ticket ID: ${ticket_id}`,
//       });

//       console.log("Created a ticket successfully by " + created_by);

//       // Emails: failures are logged but don't fail the request
//       try {
//         if (empInfo.emp_tier === "helpdesk") {
//           console.log("HD created a ticket, no email sent");
//         } else if (empInfo.emp_tier === "user") {
//           const hdUsers = unwrap(
//             await supabase
//               .from("users_master")
//               .select("emp_email")
//               .eq("emp_tier", "helpdesk"),
//           );
//           const hdEmails = hdUsers.map((u) => u.emp_email);

//           const details = `<b>Ticket Number: </b>${ticket_id} <br>
//                      <b>Ticket Subject: </b> ${ticket_subject} <br>
//                      <b>Created By: </b> ${created_by} <br>
//                      <b>Date Created: </b> ${ts} <br>
//                      <b>Description: </b> ${Description} <br><br>`;

//           const hdHtml =
//             "Good Day, <br><br>" +
//             "This is to inform you that a new support ticket has been successfully created in our system. Below are the details for your reference: <br><br>" +
//             details +
//             "Kindly review the ticket and take the necessary action in accordance with our standard support procedures.<br>" +
//             `You may access and update the ticket via the <a href=${process.env.REACT_CLIENT}/view-hd-ticket?id=${ticket_id}>Click me to view ticket</a> link.<br><br>` +
//             "Thank you for your prompt attention to this matter.<br><br>" +
//             END +
//             PRIVACY;

//           const userHtml =
//             `Hello ${Fullname},<br><br>` +
//             "Thank you for submitting a ticket. Below are the details of your ticket: <br><br>" +
//             details +
//             "Our support team will review your ticket and get back to you as soon as possible.<br>" +
//             'You can track the status of your ticket by logging into the system and navigating to the "My Tickets" section.<br><br>' +
//             "If you have additional information to provide you can update your ticket directly in the system.<br><br>" +
//             END +
//             PRIVACY;

//           const subject = "Help Desk System Notification - New Ticket Created";
//           await sendMail(hdEmails, subject, hdHtml);
//           await sendMail(empInfo.emp_email, subject, userHtml);
//         }
//       } catch (err) {
//         console.error("Unable to submit email: ", err);
//       }

//       return res.status(200).json({
//         message:
//           empInfo.emp_tier === "helpdesk"
//             ? "Ticket created successfully"
//             : "Ticket created successfully and email sent to HD",
//       });
//     } catch (err) {
//       console.error("Error creating ticket:", err);
//       return res.status(500).json({ error: "Internal Server Error" });
//     }
//   },
// );

// // ---------------- Create ticket (HELPDESK) ----------------

// router.post("/create-ticket", upload.array("Attachments"), async (req, res) => {
//   const ts = now();
//   try {
//     const {
//       ticket_subject,
//       ticket_category,
//       ticket_SubCategory,
//       tag_id,
//       Description,
//       assigned_location,
//       created_by,
//     } = req.body;

//     const attachmentPath = req.files?.length
//       ? req.files.map((f) => f.path).join(";")
//       : null;

//     const ticket_id = await generateUniqueTicketId();
//     if (!ticket_id) {
//       return res
//         .status(500)
//         .json({
//           error: "Failed to generate a unique ticket ID, please try again.",
//         });
//     }

//     unwrap(
//       await supabase.from("ticket_master").insert({
//         ticket_subject,
//         ticket_id,
//         ticket_status: "open",
//         ticket_urgencyLevel: "low",
//         ticket_category,
//         ticket_SubCategory,
//         ticket_for: created_by,
//         assigned_location,
//         tag_id,
//         Description,
//         created_by,
//         created_at: ts,
//         Attachments: attachmentPath,
//         is_active: true,
//       }),
//     );

//     await addLog({
//       ticket_id,
//       ticket_status: "open",
//       ticket_subject,
//       ticket_urgencyLevel: "low",
//       ticket_category,
//       created_by,
//       time_date: ts,
//       changes_made: `${created_by} submmited the ticket, Ticket ID: ${ticket_id}`,
//     });

//     console.log("Created a ticket successfully by " + created_by);
//     res.status(200).json({ message: "Ticket created successfully" });
//   } catch (err) {
//     console.error("Error creating ticket:", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// // ---------------- Read ----------------

// router.get("/get-all-ticket", async (req, res) => {
//   try {
//     const all = unwrap(await supabase.from("ticket_master").select("*"));
//     res.json(all);
//   } catch (err) {
//     console.error("INTERNAL ERROR: ", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// router.get("/ticket-by-id", async (req, res) => {
//   try {
//     const ticket = await getTicket(req.query.id);
//     res.json(ticket); // null if not found
//   } catch (err) {
//     console.error("Error fetching getbyid internal:", err);
//     res.status(500).json({ error: "Failed to fetch ticketbyid" });
//   }
// });

// // ---------------- Locking ----------------

// // (NOT BEEN USED)
// router.post("/is_locked", async (req, res) => {
//   try {
//     const { ticket_id, is_locked, updating_by } = req.body;
//     await updateTicket(ticket_id, { is_locked, updating_by, locked_at: now() });
//     res.status(200).json({ success: true });
//   } catch (err) {
//     console.error("INTERNAL ERROR on /is_locked:", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// router.post("/lock", async (req, res) => {
//   try {
//     const { ticket_id, updating_by } = req.body;
//     const ticket = await getTicket(ticket_id);
//     if (!ticket)
//       return res
//         .status(404)
//         .json({ success: false, message: "Ticket not found" });

//     if (
//       ticket.is_locked &&
//       ticket.updating_by &&
//       ticket.updating_by !== updating_by
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: `${ticket.updating_by} is currently working on this ticket`,
//       });
//     }

//     await updateTicket(ticket_id, {
//       is_locked: true,
//       updating_by,
//       locked_at: now(),
//     });
//     res.json({ success: true, message: "Ticket locked/refreshed" });
//   } catch (err) {
//     console.error("Lock error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// router.post("/unlock", async (req, res) => {
//   try {
//     const { ticket_id, updating_by } = req.body || {};
//     if (!ticket_id || !updating_by) {
//       return res.status(400).json({ success: false, message: "Missing data" });
//     }

//     unwrap(
//       await supabase
//         .from("ticket_master")
//         .update({ is_locked: false, updating_by: null, locked_at: null })
//         .eq("ticket_id", ticket_id)
//         .eq("updating_by", updating_by),
//     );

//     res.json({ success: true, message: "Ticket unlocked" });
//   } catch (err) {
//     console.error("Unlock error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// // ---------------- Archive / un-archive ----------------

// const setArchived = (isActive, label, successMsg) => async (req, res) => {
//   try {
//     const { ticket_id, updated_by } = req.body;
//     await updateTicket(ticket_id, { is_active: isActive, updated_by });
//     await addLog({
//       ticket_id,
//       created_by: updated_by,
//       time_date: now(),
//       changes_made: `${updated_by} ${label} this ticket`,
//     });
//     res.status(200).json({ message: successMsg });
//   } catch (err) {
//     console.error("INTERNAL ERROR: ", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// router.post(
//   "/archive-ticket",
//   setArchived(false, "Archived", "Ticket archived successfully"),
// );
// router.post(
//   "/un-archive-ticket",
//   setArchived(true, "Un-Archived", "Ticket un-archived successfully"),
// );

// // ---------------- Notification flags ----------------

// router.post("/notified-true", async (req, res) => {
//   try {
//     const { ticket_id, user_id } = req.body;
//     const empInfo = await getUserById(user_id);

//     if (empInfo?.emp_tier === "helpdesk")
//       await updateTicket(ticket_id, { is_notified: true });
//     else if (empInfo?.emp_tier === "user")
//       await updateTicket(ticket_id, { is_notifiedhd: true });

//     res.status(200).json({ message: "Updated notif", ticket_id });
//   } catch (err) {
//     console.error("Unable to update notification: ", err);
//     res.status(500).json({ error: "Failed to update notification" });
//   }
// });

// router.post("/update-notified-false", async (req, res) => {
//   try {
//     const { ticket_id, user_id } = req.body;
//     const empInfo = await getUserById(user_id);

//     if (empInfo?.emp_tier === "helpdesk")
//       await updateTicket(ticket_id, { is_notifiedhd: false });
//     else if (empInfo?.emp_tier === "user")
//       await updateTicket(ticket_id, { is_notified: false });

//     res.status(200).json({ message: "Updated notif", ticket_id });
//   } catch (err) {
//     console.error("Unable to update notification: ", err);
//     res.status(500).json({ error: "Failed to update notification" });
//   }
// });

// // ---------------- Assign ----------------

// router.post("/update-ticket-assigned", async (req, res) => {
//   try {
//     const ts = now();
//     const { assigned_to, updated_by, ticket_id, ticket_status } = req.body;

//     const updateByInfo = await getUserById(updated_by);

//     await updateTicket(ticket_id, {
//       assigned_to,
//       ticket_status,
//       updated_by: updateByInfo.user_name,
//       updated_at: ts,
//     });

//     await addLog({
//       ticket_id,
//       ticket_status: "assigned",
//       created_by: updateByInfo.user_name,
//       time_date: ts,
//       changes_made: `${updateByInfo.user_name} assinged the ticket to ${assigned_to}`,
//     });

//     const assignedToInfo = await getUserByName(assigned_to);
//     const ticket = await getTicket(ticket_id);

//     const html =
//       `Hello ${capitalize(assignedToInfo.user_name)}<br><br>` +
//       "The following support ticket has been assigned to you:<br>" +
//       "Below are the details of the ticket: <br><br>" +
//       `<b>Ticket Number: </b>${ticket_id} <br>` +
//       `<b>Ticket Subject: </b> ${ticket.ticket_subject} <br>` +
//       `<b>Ticket Status: </b> ${ticket_status} <br><br>` +
//       END +
//       PRIVACY;

//     await sendMail(assignedToInfo.emp_email, UPDATE_SUBJECT, html);
//     console.log(
//       `Email sent to ${assignedToInfo.emp_email} regarding ticket update`,
//     );

//     res.status(200).json({ message: "Ticket updated successfully" });
//   } catch (err) {
//     console.error("INTERNAL ERROR: ", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// // ---------------- Update ticket ----------------

// router.post("/update-ticket", upload.array("attachments"), async (req, res) => {
//   const ts = now();
//   try {
//     const {
//       ticket_id,
//       ticket_subject,
//       ticket_status,
//       ticket_urgencyLevel,
//       Description,
//       ticket_category,
//       ticket_SubCategory,
//       updated_by,
//       assigned_collaborators,
//       ticket_for,
//       changes_made,
//       assigned_location,
//       ticket_for_UserId,
//       assigned_to_UserId,
//       assigned_to,
//       CloseReason,
//       tag_id,
//     } = req.body;

//     const updateByInfo = await getUserById(updated_by);

//     // Attachments
//     let attachmentPath = null;
//     if (req.files?.length) {
//       const existing = unwrap(
//         await supabase
//           .from("ticket_master")
//           .select("Attachments")
//           .eq("ticket_id", ticket_id)
//           .maybeSingle(),
//       );
//       if (existing?.Attachments) {
//         for (const oldPath of existing.Attachments.split(/[;,]/).filter(
//           Boolean,
//         )) {
//           const fullPath = path.join(__dirname, "..", oldPath);
//           fs.unlink(fullPath, (err) => {
//             if (err)
//               console.error(`Error deleting file ${fullPath}:`, err.message);
//           });
//         }
//       }
//       attachmentPath = req.files
//         .map((f) => f.path.replace(/\\/g, "/"))
//         .join(",");
//     } else if (req.body.Attachments) {
//       attachmentPath = req.body.Attachments;
//     }

//     if (ticket_status === "open") {
//       await updateTicket(ticket_id, { assigned_to: "" });
//     } else if (assigned_to && assigned_to.trim() !== "") {
//       await updateTicket(ticket_id, {
//         assigned_to,
//         updated_by: updateByInfo.user_name,
//         updated_at: ts,
//       });
//     }

//     await updateTicket(ticket_id, {
//       ticket_subject,
//       ticket_status,
//       ticket_urgencyLevel,
//       tag_id,
//       ticket_category,
//       ticket_SubCategory,
//       Attachments: attachmentPath,
//       Description,
//       assigned_collaborators,
//       assigned_location,
//       ticket_for,
//       updated_at: ts,
//       updated_by: updateByInfo.user_name,
//     });

//     await addLog({
//       ticket_id,
//       ticket_status,
//       ticket_subject,
//       ticket_urgencyLevel,
//       ticket_category,
//       created_by: updateByInfo.user_name,
//       time_date: ts,
//       changes_made,
//     });

//     console.log(`Ticket ${ticket_id} was updated by ${updateByInfo.user_name}`);
//     res.status(200).json({ message: "Ticket updated successfully" });

//     // ---- Notifications (after responding) ----
//     if (!ticket_status) return;
//     try {
//       const details =
//         `<b>Ticket Number: </b>${ticket_id} <br>` +
//         `<b>Ticket Subject: </b> ${ticket_subject} <br>` +
//         `<b>Ticket Status: </b> ${ticket_status} <br><br>`;

//       if (ticket_status === "in-progress") {
//         const info = await getUserById(ticket_for_UserId);
//         const html =
//           `Hello ${capitalize(info.user_name)}, <br><br>` +
//           "Good News! One of our support team members has started working on the ticket that you submitted.<br>" +
//           "Below are the details of your ticket: <br><br>" +
//           details +
//           "You will receive further updates as soon as there are developments or when the issue is resolved.<br>" +
//           "If you have additional information to provide you can update your ticket directly in the system.<br><br>" +
//           END +
//           PRIVACY;
//         await sendMail(info.emp_email, UPDATE_SUBJECT, html);
//       }

//       if (ticket_status === "resolved") {
//         const info = await getUserById(ticket_for_UserId);
//         const html =
//           `Hello ${capitalize(info.user_name)}, <br><br>` +
//           "This is to inform you that your ticket has been resolved by our support team.<br>" +
//           "Below are the details of your ticket: <br><br>" +
//           details +
//           "To help us improve our service, we kindly request you to leave a review regarding your experience.<br>" +
//           `<a href=${process.env.REACT_CLIENT}/view-ticket?id=${ticket_id}>Click me to view the ticket</a><br>` +
//           "Your feedback is highly valuable to us and helps ensure we continue to provide the best support possible.<br><br>" +
//           "If you are still having this issue/error, you can re-open the ticket status or create a new ticket.<br><br>" +
//           END +
//           PRIVACY;
//         await sendMail(info.emp_email, UPDATE_SUBJECT, html);
//         await updateTicket(ticket_id, {
//           resolved_at: ts,
//           resolved_by: updateByInfo.user_name,
//         });
//       }

//       if (ticket_status === "re-opened") {
//         const info = await getUserById(assigned_to_UserId);
//         const html =
//           `Hello ${capitalize(info.user_name)}<br><br>` +
//           "The following support ticket has been re-opened by the user and requires further attention.<br>" +
//           "Below are the details of the ticket: <br><br>" +
//           details +
//           "Please review the ticket details and continue with the necessary follow-up actions." +
//           END +
//           PRIVACY;
//         await sendMail(info.emp_email, UPDATE_SUBJECT, html);
//         await updateTicket(ticket_id, { is_reviewed: false });
//       }

//       if (ticket_status === "closed") {
//         const info = await getUserById(assigned_to_UserId);
//         const html =
//           `Hello ${capitalize(info.user_name)}<br><br>` +
//           "The following support ticket has been closed:<br>" +
//           "Below are the details of the ticket: <br><br>" +
//           details +
//           `<b>Reason for closing: ${CloseReason}</b><br>` +
//           "No further action is required at this time. If the issue reoccurs or the user needs additional assistance, the ticket may be re-opened.<br><br>" +
//           END +
//           PRIVACY;
//         await sendMail(info.emp_email, UPDATE_SUBJECT, html);
//         await updateTicket(ticket_id, { is_reviewed: false });
//       }
//     } catch (err) {
//       console.error("INTERNAL ERROR (notifications): ", err);
//     }
//   } catch (err) {
//     console.error("Error updating ticket:", err);
//     if (!res.headersSent)
//       res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// // ---------------- Accept ticket ----------------

// router.post("/update-accept-ticket", async (req, res) => {
//   const ts = now();
//   try {
//     const { user_id, ticket_id, ticket_status } = req.body;
//     const empInfo = await getUserById(user_id);
//     const ticketInfo = await getTicket(ticket_id);

//     if (ticket_status === "closed") {
//       await updateTicket(ticket_id, {
//         assigned_to: empInfo.user_name,
//         updated_at: ts,
//         responded_at: ts,
//         ticket_status: "re-opened",
//         is_reviewed: false,
//       });
//     } else {
//       await updateTicket(ticket_id, {
//         assigned_to: empInfo.user_name,
//         updated_at: ts,
//         responded_at: ts,
//         ticket_status: "assigned",
//       });
//     }

//     const messages = {
//       closed: `${empInfo.user_name} accepted closed ticket and re-opened the ticket, Ticket ID: ${ticket_id}`,
//       open: `${empInfo.user_name} accepted open ticket and was assigned ,Ticket ID: ${ticket_id}`,
//       resolved: `${empInfo.user_name} accepted resolved ticket and was assigned, Ticket ID: ${ticket_id}`,
//     };

//     if (messages[ticket_status]) {
//       await addLog({
//         ticket_id,
//         ticket_status,
//         ticket_subject: ticketInfo.ticket_subject,
//         ticket_urgencyLevel: ticketInfo.ticket_urgencyLevel,
//         ticket_category: ticketInfo.ticket_category,
//         created_by: empInfo.user_name,
//         time_date: ts,
//         changes_made: messages[ticket_status],
//       });
//     }

//     console.log(
//       `Ticket ${ticket_id} was successfully accepted by ${empInfo.user_name}`,
//     );
//     res.status(200).json({ message: "Ticket accepted successfully" });
//   } catch (err) {
//     console.error("Update Accept error: ", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// // ---------------- Logs ----------------

// router.get("/ticket-logs", async (req, res) => {
//   try {
//     const logs = unwrap(
//       await supabase
//         .from("ticket_logs")
//         .select("*")
//         .eq("ticket_id", req.query.id),
//     );
//     res.json(logs);
//   } catch (err) {
//     console.error("INTERNAL ERROR: ", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// // ---------------- Notes ----------------

// router.post(
//   "/note-post",
//   uploadNotes.array("note_upload_path"),
//   async (req, res) => {
//     const ts = now();
//     try {
//       const { notes, current_user, ticket_id } = req.body;
//       const attachmentPath = req.files?.length
//         ? req.files.map((f) => f.path).join(";")
//         : null;

//       unwrap(
//         await supabase.from("notes_master").insert({
//           note: notes,
//           created_by: current_user,
//           created_at: ts,
//           ticket_id,
//           note_upload_path: attachmentPath,
//         }),
//       );

//       await addLog({
//         ticket_id,
//         created_by: current_user,
//         time_date: ts,
//         changes_made: `${current_user} placed a note "${notes}"`,
//       });

//       res.status(200).json({ message: "Placed a note successfully" });
//     } catch (err) {
//       console.error("Internal Error: ", err);
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   },
// );

// router.get("/get-all-notes/:ticket_id", async (req, res) => {
//   try {
//     const notes = unwrap(
//       await supabase
//         .from("notes_master")
//         .select("*")
//         .eq("ticket_id", req.params.ticket_id)
//         .order("created_at", { ascending: true }),
//     );
//     res.json(notes);
//   } catch (err) {
//     console.error("INTERNAL ERROR: ", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// // ---------------- Feedback / reviews ----------------

// router.get("/get-all-feedback/:ticket_id", async (req, res) => {
//   try {
//     const feedback = unwrap(
//       await supabase
//         .from("review_master")
//         .select("*")
//         .eq("ticket_id", req.params.ticket_id)
//         .order("created_at", { ascending: true }),
//     );
//     res.json(feedback);
//   } catch (err) {
//     console.error("INTERNAL ERROR: ", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// router.get("/get-all-feedback", async (req, res) => {
//   try {
//     const all = unwrap(await supabase.from("review_master").select("*"));
//     res.status(200).json(all);
//   } catch (err) {
//     console.error("INTERNAL ERROR: ", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// router.post("/feedback", async (req, res) => {
//   try {
//     const { review, user_id, created_by, ticket_id, score } = req.body;
//     unwrap(
//       await supabase.from("review_master").insert({
//         review,
//         user_id,
//         created_at: now(),
//         created_by,
//         ticket_id,
//         score,
//       }),
//     );
//     await updateTicket(ticket_id, { is_reviewed: true });
//     res.status(200).json({ message: "Feedback saved successfully" });
//   } catch (err) {
//     console.error("INTERNAL ERROR: ", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// // Replaces the existing review with a new one
// router.post("/feedback-delete-by-id", async (req, res) => {
//   try {
//     const { ticket_id, review, user_id, created_by, score } = req.body;
//     unwrap(
//       await supabase.from("review_master").delete().eq("ticket_id", ticket_id),
//     );
//     unwrap(
//       await supabase.from("review_master").insert({
//         review,
//         user_id,
//         created_at: now(),
//         created_by,
//         ticket_id,
//         score,
//       }),
//     );
//     await updateTicket(ticket_id, { is_reviewed: true });
//     res.status(200).json({ message: "Feedback saved successfully" });
//   } catch (err) {
//     console.error("INTERNAL ERROR: ", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// router.post("/feedback-by-id", async (req, res) => {
//   try {
//     const { review_id } = req.body;
//     const review = unwrap(
//       await supabase
//         .from("review_master")
//         .select("*")
//         .eq("review_id", review_id)
//         .maybeSingle(),
//     );
//     res.json(review);
//   } catch (err) {
//     console.error("INTERNAL ERROR: ", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// router.post("/send-notification-review", async (req, res) => {
//   try {
//     const { ticket_for_id, ticket_id } = req.body;
//     const info = await getUserById(ticket_for_id);

//     const html =
//       `Hello ${capitalize(info.user_name)},<br><br>` +
//       `We’re glad to inform you that your ticket #${ticket_id} has been successfully resolved.` +
//       " At this stage, you may now proceed to close the ticket if you are satisfied with the resolution.<br>" +
//       "We would also appreciate it if you could take a moment to provide your review or feedback on your " +
//       "experience. Your input is valuable and helps us continue improving our support services.<br><br>" +
//       `<a href="${process.env.REACT_CLIENT}/view-ticket?id=${ticket_id}">Submit Your Feedback Here.</a><br><br>` +
//       "If the issue persists or you require further assistance, you may reopen the ticket at any time.<br><br>" +
//       "Thank you for your cooperation and support!<br><br>" +
//       END +
//       PRIVACY;

//     await sendMail(
//       info.emp_email,
//       `Ticket #${ticket_id} Resolved – Awaiting Your Feedback`,
//       html,
//     );
//     res.status(200).json({ message: "Review notification sent" });
//   } catch (err) {
//     console.error("INTERNAL ERROR: ", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// // ---------------- TAT ----------------

// router.post("/turnaround-time", async (req, res) => {
//   try {
//     const {
//       tat,
//       user_id,
//       ticket_id,
//       user_name,
//       category,
//       sub_category,
//       ticket_type,
//       ticket_created_at,
//       created_by,
//     } = req.body;
//     unwrap(
//       await supabase.from("tat_master").insert({
//         tat,
//         user_id,
//         ticket_id,
//         user_name,
//         category,
//         sub_category,
//         created_by,
//         ticket_created_at,
//         ticket_type,
//         created_at: now(),
//       }),
//     );
//     res.status(200).json({ message: "TAT saved successfully" });
//   } catch (err) {
//     console.error("INTERNAL ERROR: ", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// // ---------------- Custom subcategories ----------------

// router.post("/add-custom-subcategory", async (req, res) => {
//   try {
//     const { category, subcategory } = req.body;
//     unwrap(
//       await supabase
//         .from("option_master")
//         .insert({ category, sub_category: subcategory }),
//     );
//     res.status(200).json({ message: "Sub cat saved successfully!" });
//   } catch (err) {
//     console.error("Unable to add custom sub-cat: ", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// router.get("/get-custom-subcategories", async (req, res) => {
//   try {
//     const all = unwrap(await supabase.from("option_master").select("*"));
//     res.status(200).json(all);
//   } catch (err) {
//     console.error("Unable to get custom subcat: ", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const supabase = require("../supabase");

// ---------------- Helpers ----------------

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

const now = () => new Date().toISOString();

const capitalize = (s = "") =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

const getUserById = async (user_id) =>
  unwrap(
    await supabase
      .from("users_master")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle(),
  );

const getUserByName = async (user_name) =>
  unwrap(
    await supabase
      .from("users_master")
      .select("*")
      .eq("user_name", user_name)
      .maybeSingle(),
  );

const getTicket = async (ticket_id) =>
  unwrap(
    await supabase
      .from("ticket_master")
      .select("*")
      .eq("ticket_id", ticket_id)
      .maybeSingle(),
  );

const updateTicket = async (ticket_id, fields) =>
  unwrap(
    await supabase
      .from("ticket_master")
      .update(fields)
      .eq("ticket_id", ticket_id),
  );

const addLog = async (fields) =>
  unwrap(await supabase.from("ticket_logs").insert(fields));

// ---------------- Email ----------------

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  secure: false,
  auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS },
  tls: { rejectUnauthorized: false },
});

const END = "Best regards,<br> Lepanto Helpdesk System";
const PRIVACY =
  '<br><p style="color:gray;font-size:12px">Privacy Notice: </p>' +
  '<p style="color:gray;font-size:12px">The content of this email is intended for the person ' +
  "or entity to which it is addressed only. This email may contain confidential information. If you are not the person " +
  "to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly " +
  "prohibited.</p>";

const sendMail = (to, subject, html) =>
  transporter.sendMail({ from: process.env.EMAIL, to, subject, html });

const UPDATE_SUBJECT = "Help Desk System Notification - Ticket Updated";

// ---------------- Uploads (Supabase Storage) ----------------

// Memory storage — files go to Supabase, not local disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
});

const uploadNotes = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
});

// Upload helper — sends files to a Supabase Storage bucket
const uploadFilesToSupabase = async (files, bucket) => {
  if (!files || files.length === 0) return null;
  const paths = [];
  for (const file of files) {
    const fileName = `${new Date().toISOString().replace(/[:.]/g, "-")}_${file.originalname.replace(/\s+/g, "_")}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });
    if (error) throw error;
    paths.push(data.path);
  }
  return paths.join(";");
};

// ---------------- Ticket ID ----------------

function generateTicketId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";
  for (let i = 0; i < 6; i++)
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  return `ST${randomPart}`;
}

async function generateUniqueTicketId() {
  for (let i = 0; i < 10; i++) {
    const id = generateTicketId();
    const existing = unwrap(
      await supabase
        .from("ticket_master")
        .select("ticket_id")
        .eq("ticket_id", id)
        .maybeSingle(),
    );
    if (!existing) return id;
  }
  return null;
}

// ---------------- Create ticket (USER) ----------------

router.post(
  "/create-ticket-user",
  upload.array("Attachments"),
  async (req, res) => {
    const ts = now();
    try {
      const {
        ticket_subject,
        tag_id,
        Description,
        assigned_location,
        created_by,
        user_id,
      } = req.body;

      const empInfo = await getUserById(user_id);
      if (!empInfo) return res.status(404).json({ error: "User not found" });
      const Fullname = capitalize(empInfo.emp_FirstName);

      // Upload attachments to Supabase Storage
      const attachmentPath = await uploadFilesToSupabase(req.files, "uploads");

      const ticket_id = await generateUniqueTicketId();
      if (!ticket_id) {
        return res.status(500).json({
          error: "Failed to generate a unique ticket ID, please try again.",
        });
      }

      unwrap(
        await supabase.from("ticket_master").insert({
          ticket_id,
          ticket_subject,
          ticket_status: "open",
          ticket_urgencyLevel: "low",
          ticket_category: "",
          ticket_SubCategory: "",
          ticket_for: created_by,
          assigned_location,
          tag_id,
          Description,
          created_by,
          created_at: ts,
          Attachments: attachmentPath,
          is_active: true,
        }),
      );

      await addLog({
        ticket_id,
        ticket_status: "open",
        created_by,
        time_date: ts,
        changes_made: `User ${created_by} submmited the ticket, Ticket ID: ${ticket_id}`,
      });

      console.log("Created a ticket successfully by " + created_by);

      try {
        if (empInfo.emp_tier === "helpdesk") {
          console.log("HD created a ticket, no email sent");
        } else if (empInfo.emp_tier === "user") {
          const hdUsers = unwrap(
            await supabase
              .from("users_master")
              .select("emp_email")
              .eq("emp_tier", "helpdesk"),
          );
          const hdEmails = hdUsers.map((u) => u.emp_email);

          const details = `<b>Ticket Number: </b>${ticket_id} <br>
                     <b>Ticket Subject: </b> ${ticket_subject} <br>
                     <b>Created By: </b> ${created_by} <br>
                     <b>Date Created: </b> ${ts} <br>
                     <b>Description: </b> ${Description} <br><br>`;

          const hdHtml =
            "Good Day, <br><br>" +
            "This is to inform you that a new support ticket has been successfully created in our system. Below are the details for your reference: <br><br>" +
            details +
            "Kindly review the ticket and take the necessary action in accordance with our standard support procedures.<br>" +
            `You may access and update the ticket via the <a href=${process.env.REACT_CLIENT}/view-hd-ticket?id=${ticket_id}>Click me to view ticket</a> link.<br><br>` +
            "Thank you for your prompt attention to this matter.<br><br>" +
            END +
            PRIVACY;

          const userHtml =
            `Hello ${Fullname},<br><br>` +
            "Thank you for submitting a ticket. Below are the details of your ticket: <br><br>" +
            details +
            "Our support team will review your ticket and get back to you as soon as possible.<br>" +
            'You can track the status of your ticket by logging into the system and navigating to the "My Tickets" section.<br><br>' +
            "If you have additional information to provide you can update your ticket directly in the system.<br><br>" +
            END +
            PRIVACY;

          const subject = "Help Desk System Notification - New Ticket Created";
          await sendMail(hdEmails, subject, hdHtml);
          await sendMail(empInfo.emp_email, subject, userHtml);
        }
      } catch (err) {
        console.error("Unable to submit email: ", err);
      }

      return res.status(200).json({
        message:
          empInfo.emp_tier === "helpdesk"
            ? "Ticket created successfully"
            : "Ticket created successfully and email sent to HD",
      });
    } catch (err) {
      console.error("Error creating ticket:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

// ---------------- Create ticket (HELPDESK) ----------------

router.post("/create-ticket", upload.array("Attachments"), async (req, res) => {
  const ts = now();
  try {
    const {
      ticket_subject,
      ticket_category,
      ticket_SubCategory,
      tag_id,
      Description,
      assigned_location,
      created_by,
    } = req.body;

    // Upload attachments to Supabase Storage
    const attachmentPath = await uploadFilesToSupabase(req.files, "uploads");

    const ticket_id = await generateUniqueTicketId();
    if (!ticket_id) {
      return res.status(500).json({
        error: "Failed to generate a unique ticket ID, please try again.",
      });
    }

    unwrap(
      await supabase.from("ticket_master").insert({
        ticket_subject,
        ticket_id,
        ticket_status: "open",
        ticket_urgencyLevel: "low",
        ticket_category,
        ticket_SubCategory,
        ticket_for: created_by,
        assigned_location,
        tag_id,
        Description,
        created_by,
        created_at: ts,
        Attachments: attachmentPath,
        is_active: true,
      }),
    );

    await addLog({
      ticket_id,
      ticket_status: "open",
      ticket_subject,
      ticket_urgencyLevel: "low",
      ticket_category,
      created_by,
      time_date: ts,
      changes_made: `${created_by} submmited the ticket, Ticket ID: ${ticket_id}`,
    });

    console.log("Created a ticket successfully by " + created_by);
    res.status(200).json({ message: "Ticket created successfully" });
  } catch (err) {
    console.error("Error creating ticket:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------- Read ----------------

router.get("/get-all-ticket", async (req, res) => {
  try {
    const all = unwrap(await supabase.from("ticket_master").select("*"));
    res.json(all);
  } catch (err) {
    console.error("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/ticket-by-id", async (req, res) => {
  try {
    const ticket = await getTicket(req.query.id);
    res.json(ticket);
  } catch (err) {
    console.error("Error fetching getbyid internal:", err);
    res.status(500).json({ error: "Failed to fetch ticketbyid" });
  }
});

// ---------------- Signed URL (for viewing attachments) ----------------

router.get("/attachment-url", async (req, res) => {
  try {
    const { path: filePath, bucket } = req.query;
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 60 * 60); // 1 hour
    if (error) throw error;
    res.json({ url: data.signedUrl });
  } catch (err) {
    console.error("Error generating signed URL:", err);
    res.status(500).json({ error: "Failed to generate URL" });
  }
});

// ---------------- Locking ----------------

router.post("/is_locked", async (req, res) => {
  try {
    const { ticket_id, is_locked, updating_by } = req.body;
    await updateTicket(ticket_id, { is_locked, updating_by, locked_at: now() });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("INTERNAL ERROR on /is_locked:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/lock", async (req, res) => {
  try {
    const { ticket_id, updating_by } = req.body;
    const ticket = await getTicket(ticket_id);
    if (!ticket)
      return res
        .status(404)
        .json({ success: false, message: "Ticket not found" });

    if (
      ticket.is_locked &&
      ticket.updating_by &&
      ticket.updating_by !== updating_by
    ) {
      return res.status(403).json({
        success: false,
        message: `${ticket.updating_by} is currently working on this ticket`,
      });
    }

    await updateTicket(ticket_id, {
      is_locked: true,
      updating_by,
      locked_at: now(),
    });
    res.json({ success: true, message: "Ticket locked/refreshed" });
  } catch (err) {
    console.error("Lock error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/unlock", async (req, res) => {
  try {
    const { ticket_id, updating_by } = req.body || {};
    if (!ticket_id || !updating_by) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    unwrap(
      await supabase
        .from("ticket_master")
        .update({ is_locked: false, updating_by: null, locked_at: null })
        .eq("ticket_id", ticket_id)
        .eq("updating_by", updating_by),
    );

    res.json({ success: true, message: "Ticket unlocked" });
  } catch (err) {
    console.error("Unlock error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------- Archive / un-archive ----------------

const setArchived = (isActive, label, successMsg) => async (req, res) => {
  try {
    const { ticket_id, updated_by } = req.body;
    await updateTicket(ticket_id, { is_active: isActive, updated_by });
    await addLog({
      ticket_id,
      created_by: updated_by,
      time_date: now(),
      changes_made: `${updated_by} ${label} this ticket`,
    });
    res.status(200).json({ message: successMsg });
  } catch (err) {
    console.error("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

router.post(
  "/archive-ticket",
  setArchived(false, "Archived", "Ticket archived successfully"),
);
router.post(
  "/un-archive-ticket",
  setArchived(true, "Un-Archived", "Ticket un-archived successfully"),
);

// ---------------- Notification flags ----------------

router.post("/notified-true", async (req, res) => {
  try {
    const { ticket_id, user_id } = req.body;
    const empInfo = await getUserById(user_id);

    if (empInfo?.emp_tier === "helpdesk")
      await updateTicket(ticket_id, { is_notified: true });
    else if (empInfo?.emp_tier === "user")
      await updateTicket(ticket_id, { is_notifiedhd: true });

    res.status(200).json({ message: "Updated notif", ticket_id });
  } catch (err) {
    console.error("Unable to update notification: ", err);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

router.post("/update-notified-false", async (req, res) => {
  try {
    const { ticket_id, user_id } = req.body;
    const empInfo = await getUserById(user_id);

    if (empInfo?.emp_tier === "helpdesk")
      await updateTicket(ticket_id, { is_notifiedhd: false });
    else if (empInfo?.emp_tier === "user")
      await updateTicket(ticket_id, { is_notified: false });

    res.status(200).json({ message: "Updated notif", ticket_id });
  } catch (err) {
    console.error("Unable to update notification: ", err);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// ---------------- Assign ----------------

router.post("/update-ticket-assigned", async (req, res) => {
  try {
    const ts = now();
    const { assigned_to, updated_by, ticket_id, ticket_status } = req.body;

    const updateByInfo = await getUserById(updated_by);

    await updateTicket(ticket_id, {
      assigned_to,
      ticket_status,
      updated_by: updateByInfo.user_name,
      updated_at: ts,
    });

    await addLog({
      ticket_id,
      ticket_status: "assigned",
      created_by: updateByInfo.user_name,
      time_date: ts,
      changes_made: `${updateByInfo.user_name} assinged the ticket to ${assigned_to}`,
    });

    const assignedToInfo = await getUserByName(assigned_to);
    const ticket = await getTicket(ticket_id);

    const html =
      `Hello ${capitalize(assignedToInfo.user_name)}<br><br>` +
      "The following support ticket has been assigned to you:<br>" +
      "Below are the details of the ticket: <br><br>" +
      `<b>Ticket Number: </b>${ticket_id} <br>` +
      `<b>Ticket Subject: </b> ${ticket.ticket_subject} <br>` +
      `<b>Ticket Status: </b> ${ticket_status} <br><br>` +
      END +
      PRIVACY;

    await sendMail(assignedToInfo.emp_email, UPDATE_SUBJECT, html);
    console.log(
      `Email sent to ${assignedToInfo.emp_email} regarding ticket update`,
    );

    res.status(200).json({ message: "Ticket updated successfully" });
  } catch (err) {
    console.error("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------- Update ticket ----------------

router.post("/update-ticket", upload.array("attachments"), async (req, res) => {
  const ts = now();
  try {
    const {
      ticket_id,
      ticket_subject,
      ticket_status,
      ticket_urgencyLevel,
      Description,
      ticket_category,
      ticket_SubCategory,
      updated_by,
      assigned_collaborators,
      ticket_for,
      changes_made,
      assigned_location,
      ticket_for_UserId,
      assigned_to_UserId,
      assigned_to,
      CloseReason,
      tag_id,
    } = req.body;

    const updateByInfo = await getUserById(updated_by);

    // Handle attachments — delete old from Supabase, upload new ones
    let attachmentPath = null;
    if (req.files?.length) {
      const existing = unwrap(
        await supabase
          .from("ticket_master")
          .select("Attachments")
          .eq("ticket_id", ticket_id)
          .maybeSingle(),
      );
      if (existing?.Attachments) {
        const oldPaths = existing.Attachments.split(/[;,]/).filter(Boolean);
        await supabase.storage.from("uploads").remove(oldPaths);
      }
      attachmentPath = await uploadFilesToSupabase(req.files, "uploads");
    } else if (req.body.Attachments) {
      attachmentPath = req.body.Attachments;
    }

    if (ticket_status === "open") {
      await updateTicket(ticket_id, { assigned_to: "" });
    } else if (assigned_to && assigned_to.trim() !== "") {
      await updateTicket(ticket_id, {
        assigned_to,
        updated_by: updateByInfo.user_name,
        updated_at: ts,
      });
    }

    await updateTicket(ticket_id, {
      ticket_subject,
      ticket_status,
      ticket_urgencyLevel,
      tag_id,
      ticket_category,
      ticket_SubCategory,
      Attachments: attachmentPath,
      Description,
      assigned_collaborators,
      assigned_location,
      ticket_for,
      updated_at: ts,
      updated_by: updateByInfo.user_name,
    });

    await addLog({
      ticket_id,
      ticket_status,
      ticket_subject,
      ticket_urgencyLevel,
      ticket_category,
      created_by: updateByInfo.user_name,
      time_date: ts,
      changes_made,
    });

    console.log(`Ticket ${ticket_id} was updated by ${updateByInfo.user_name}`);
    res.status(200).json({ message: "Ticket updated successfully" });

    if (!ticket_status) return;
    try {
      const details =
        `<b>Ticket Number: </b>${ticket_id} <br>` +
        `<b>Ticket Subject: </b> ${ticket_subject} <br>` +
        `<b>Ticket Status: </b> ${ticket_status} <br><br>`;

      if (ticket_status === "in-progress") {
        const info = await getUserById(ticket_for_UserId);
        const html =
          `Hello ${capitalize(info.user_name)}, <br><br>` +
          "Good News! One of our support team members has started working on the ticket that you submitted.<br>" +
          "Below are the details of your ticket: <br><br>" +
          details +
          "You will receive further updates as soon as there are developments or when the issue is resolved.<br>" +
          "If you have additional information to provide you can update your ticket directly in the system.<br><br>" +
          END +
          PRIVACY;
        await sendMail(info.emp_email, UPDATE_SUBJECT, html);
      }

      if (ticket_status === "resolved") {
        const info = await getUserById(ticket_for_UserId);
        const html =
          `Hello ${capitalize(info.user_name)}, <br><br>` +
          "This is to inform you that your ticket has been resolved by our support team.<br>" +
          "Below are the details of your ticket: <br><br>" +
          details +
          "To help us improve our service, we kindly request you to leave a review regarding your experience.<br>" +
          `<a href=${process.env.REACT_CLIENT}/view-ticket?id=${ticket_id}>Click me to view the ticket</a><br>` +
          "Your feedback is highly valuable to us and helps ensure we continue to provide the best support possible.<br><br>" +
          "If you are still having this issue/error, you can re-open the ticket status or create a new ticket.<br><br>" +
          END +
          PRIVACY;
        await sendMail(info.emp_email, UPDATE_SUBJECT, html);
        await updateTicket(ticket_id, {
          resolved_at: ts,
          resolved_by: updateByInfo.user_name,
        });
      }

      if (ticket_status === "re-opened") {
        const info = await getUserById(assigned_to_UserId);
        const html =
          `Hello ${capitalize(info.user_name)}<br><br>` +
          "The following support ticket has been re-opened by the user and requires further attention.<br>" +
          "Below are the details of the ticket: <br><br>" +
          details +
          "Please review the ticket details and continue with the necessary follow-up actions." +
          END +
          PRIVACY;
        await sendMail(info.emp_email, UPDATE_SUBJECT, html);
        await updateTicket(ticket_id, { is_reviewed: false });
      }

      if (ticket_status === "closed") {
        const info = await getUserById(assigned_to_UserId);
        const html =
          `Hello ${capitalize(info.user_name)}<br><br>` +
          "The following support ticket has been closed:<br>" +
          "Below are the details of the ticket: <br><br>" +
          details +
          `<b>Reason for closing: ${CloseReason}</b><br>` +
          "No further action is required at this time. If the issue reoccurs or the user needs additional assistance, the ticket may be re-opened.<br><br>" +
          END +
          PRIVACY;
        await sendMail(info.emp_email, UPDATE_SUBJECT, html);
        await updateTicket(ticket_id, { is_reviewed: false });
      }
    } catch (err) {
      console.error("INTERNAL ERROR (notifications): ", err);
    }
  } catch (err) {
    console.error("Error updating ticket:", err);
    if (!res.headersSent)
      res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------- Accept ticket ----------------

router.post("/update-accept-ticket", async (req, res) => {
  const ts = now();
  try {
    const { user_id, ticket_id, ticket_status } = req.body;
    const empInfo = await getUserById(user_id);
    const ticketInfo = await getTicket(ticket_id);

    if (ticket_status === "closed") {
      await updateTicket(ticket_id, {
        assigned_to: empInfo.user_name,
        updated_at: ts,
        responded_at: ts,
        ticket_status: "re-opened",
        is_reviewed: false,
      });
    } else {
      await updateTicket(ticket_id, {
        assigned_to: empInfo.user_name,
        updated_at: ts,
        responded_at: ts,
        ticket_status: "assigned",
      });
    }

    const messages = {
      closed: `${empInfo.user_name} accepted closed ticket and re-opened the ticket, Ticket ID: ${ticket_id}`,
      open: `${empInfo.user_name} accepted open ticket and was assigned ,Ticket ID: ${ticket_id}`,
      resolved: `${empInfo.user_name} accepted resolved ticket and was assigned, Ticket ID: ${ticket_id}`,
    };

    if (messages[ticket_status]) {
      await addLog({
        ticket_id,
        ticket_status,
        ticket_subject: ticketInfo.ticket_subject,
        ticket_urgencyLevel: ticketInfo.ticket_urgencyLevel,
        ticket_category: ticketInfo.ticket_category,
        created_by: empInfo.user_name,
        time_date: ts,
        changes_made: messages[ticket_status],
      });
    }

    console.log(
      `Ticket ${ticket_id} was successfully accepted by ${empInfo.user_name}`,
    );
    res.status(200).json({ message: "Ticket accepted successfully" });
  } catch (err) {
    console.error("Update Accept error: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------- Logs ----------------

router.get("/ticket-logs", async (req, res) => {
  try {
    const logs = unwrap(
      await supabase
        .from("ticket_logs")
        .select("*")
        .eq("ticket_id", req.query.id),
    );
    res.json(logs);
  } catch (err) {
    console.error("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------- Notes ----------------

router.post(
  "/note-post",
  uploadNotes.array("note_upload_path"),
  async (req, res) => {
    const ts = now();
    try {
      const { notes, current_user, ticket_id } = req.body;

      // Upload note attachments to Supabase Storage
      const attachmentPath = await uploadFilesToSupabase(
        req.files,
        "noteuploads",
      );

      unwrap(
        await supabase.from("notes_master").insert({
          note: notes,
          created_by: current_user,
          created_at: ts,
          ticket_id,
          note_upload_path: attachmentPath,
        }),
      );

      await addLog({
        ticket_id,
        created_by: current_user,
        time_date: ts,
        changes_made: `${current_user} placed a note "${notes}"`,
      });

      res.status(200).json({ message: "Placed a note successfully" });
    } catch (err) {
      console.error("Internal Error: ", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

router.get("/get-all-notes/:ticket_id", async (req, res) => {
  try {
    const notes = unwrap(
      await supabase
        .from("notes_master")
        .select("*")
        .eq("ticket_id", req.params.ticket_id)
        .order("created_at", { ascending: true }),
    );
    res.json(notes);
  } catch (err) {
    console.error("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------- Feedback / reviews ----------------

router.get("/get-all-feedback/:ticket_id", async (req, res) => {
  try {
    const feedback = unwrap(
      await supabase
        .from("review_master")
        .select("*")
        .eq("ticket_id", req.params.ticket_id)
        .order("created_at", { ascending: true }),
    );
    res.json(feedback);
  } catch (err) {
    console.error("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/get-all-feedback", async (req, res) => {
  try {
    const all = unwrap(await supabase.from("review_master").select("*"));
    res.status(200).json(all);
  } catch (err) {
    console.error("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/feedback", async (req, res) => {
  try {
    const { review, user_id, created_by, ticket_id, score } = req.body;
    unwrap(
      await supabase.from("review_master").insert({
        review,
        user_id,
        created_at: now(),
        created_by,
        ticket_id,
        score,
      }),
    );
    await updateTicket(ticket_id, { is_reviewed: true });
    res.status(200).json({ message: "Feedback saved successfully" });
  } catch (err) {
    console.error("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/feedback-delete-by-id", async (req, res) => {
  try {
    const { ticket_id, review, user_id, created_by, score } = req.body;
    unwrap(
      await supabase.from("review_master").delete().eq("ticket_id", ticket_id),
    );
    unwrap(
      await supabase.from("review_master").insert({
        review,
        user_id,
        created_at: now(),
        created_by,
        ticket_id,
        score,
      }),
    );
    await updateTicket(ticket_id, { is_reviewed: true });
    res.status(200).json({ message: "Feedback saved successfully" });
  } catch (err) {
    console.error("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/feedback-by-id", async (req, res) => {
  try {
    const { review_id } = req.body;
    const review = unwrap(
      await supabase
        .from("review_master")
        .select("*")
        .eq("review_id", review_id)
        .maybeSingle(),
    );
    res.json(review);
  } catch (err) {
    console.error("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/send-notification-review", async (req, res) => {
  try {
    const { ticket_for_id, ticket_id } = req.body;
    const info = await getUserById(ticket_for_id);

    const html =
      `Hello ${capitalize(info.user_name)},<br><br>` +
      `We're glad to inform you that your ticket #${ticket_id} has been successfully resolved.` +
      " At this stage, you may now proceed to close the ticket if you are satisfied with the resolution.<br>" +
      "We would also appreciate it if you could take a moment to provide your review or feedback on your " +
      "experience. Your input is valuable and helps us continue improving our support services.<br><br>" +
      `<a href="${process.env.REACT_CLIENT}/view-ticket?id=${ticket_id}">Submit Your Feedback Here.</a><br><br>` +
      "If the issue persists or you require further assistance, you may reopen the ticket at any time.<br><br>" +
      "Thank you for your cooperation and support!<br><br>" +
      END +
      PRIVACY;

    await sendMail(
      info.emp_email,
      `Ticket #${ticket_id} Resolved – Awaiting Your Feedback`,
      html,
    );
    res.status(200).json({ message: "Review notification sent" });
  } catch (err) {
    console.error("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------- TAT ----------------

router.post("/turnaround-time", async (req, res) => {
  try {
    const {
      tat,
      user_id,
      ticket_id,
      user_name,
      category,
      sub_category,
      ticket_type,
      ticket_created_at,
      created_by,
    } = req.body;
    unwrap(
      await supabase.from("tat_master").insert({
        tat,
        user_id,
        ticket_id,
        user_name,
        category,
        sub_category,
        created_by,
        ticket_created_at,
        ticket_type,
        created_at: now(),
      }),
    );
    res.status(200).json({ message: "TAT saved successfully" });
  } catch (err) {
    console.error("INTERNAL ERROR: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------- Custom subcategories ----------------

router.post("/add-custom-subcategory", async (req, res) => {
  try {
    const { category, subcategory } = req.body;
    unwrap(
      await supabase
        .from("option_master")
        .insert({ category, sub_category: subcategory }),
    );
    res.status(200).json({ message: "Sub cat saved successfully!" });
  } catch (err) {
    console.error("Unable to add custom sub-cat: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/get-custom-subcategories", async (req, res) => {
  try {
    const all = unwrap(await supabase.from("option_master").select("*"));
    res.status(200).json(all);
  } catch (err) {
    console.error("Unable to get custom subcat: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
