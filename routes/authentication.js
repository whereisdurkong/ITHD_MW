var express = require("express");
var bcrypt = require("bcrypt");
const router = express.Router();
const nodemailer = require("nodemailer");
require("dotenv").config();
const supabase = require("../supabase.js");

router.get("/login", async function (req, res, next) {
  try {
    const { data: user, error } = await supabase
      .from("users_master")
      .select("*")
      .eq("user_name", req.query.user_name)
      .single();

    if (error || !user) {
      return res.status(404).json({ msg: "User not found! Try again..." });
    }

    if (req.query.pass_word !== user.pass_word) {
      return res.status(401).json({ msg: "Incorrect password. Try again..." });
    }

    await supabase
      .from("users_master")
      .update({ is_active: 1 })
      .eq("user_id", user.user_id);

    const result = {
      user_id: user.user_id,
      user_name: user.user_name,
      emp_location: user.emp_location,
      emp_department: user.emp_department,
      emp_position: user.emp_position,
      emp_email: user.emp_email,
      emp_FirstName: user.emp_FirstName,
      emp_LastName: user.emp_LastName,
      is_active: user.is_active,
      emp_role: user.emp_role,
      emp_tier: user.emp_tier,
    };

    console.log(`User ${user.user_name} Logged In`);
    res.json(result);
  } catch (err) {
    console.log("Error logging in: ", err);
    return res.status(404).json({ msg: "User not found! Try again..." });
  }
});

function generateTicketId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `USD${randomPart}`;
}

router.post("/register", async function (req, res, next) {
  const currentTimestamp = new Date();
  const {
    emp_firstname,
    emp_lastname,
    user_name,
    pass_word,
    emp_email,
    emp_tier,
    emp_role,
    emp_phone,
    emp_location,
    emp_department,
    emp_position,
    current_user,
  } = req.body;

  try {
    // Fetch all existing IDs
    const { data: existingUsers } = await supabase
      .from("users_master")
      .select("user_id");

    const existingSet = new Set(existingUsers.map((u) => u.user_id));

    // Generate unique ID
    let user_id;
    let attempts = 0;
    do {
      user_id = generateTicketId();
      attempts++;
      if (attempts > 3) {
        return res.status(500).json({
          error: "Failed to generate a unique ticket ID, please try again.",
        });
      }
    } while (existingSet.has(user_id));

    // Insert new user
    await supabase.from("users_master").insert({
      user_id: user_id,
      emp_FirstName: emp_firstname,
      emp_LastName: emp_lastname,
      user_name: user_name,
      pass_word: pass_word,
      emp_email: emp_email,
      emp_tier: emp_tier,
      emp_role: emp_role,
      emp_phone: emp_phone,
      emp_location: emp_location,
      emp_department: emp_department,
      emp_position: emp_position,
      created_by: current_user,
      created_at: currentTimestamp,
      is_active: true, // changed from 1 to true
    });

    // Insert to users_logs
    await supabase.from("users_logs").insert({
      user_id: user_id,
      changes_made: `${user_name} was added by ${current_user}`,
      created_at: currentTimestamp,
      created_by: current_user,
    });

    console.log(`User was registered ${user_name} by ${current_user}`);
    res.status(200).json({ message: "User registered successfully" });

    // Email (no changes needed here)
    try {
      if (emp_tier === "user") {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          secure: false,
          auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASS,
          },
          tls: { rejectUnauthorized: false },
        });

        var end = `Best regards,<br> Lepanto Helpdesk System`;
        var privacy =
          '<br><p style="color:gray;font-size:12px">Privacy Notice: </p>' +
          '<p style="color:gray;font-size:12px">The content of this email is intended for the person ' +
          "or entity to which it is addressed only. This email may contain confidential information. If you are not the person " +
          "to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly " +
          "prohibited.</p>";

        const username =
          user_name.charAt(0).toUpperCase() + user_name.slice(1).toLowerCase();

        var body =
          `This is to inform you that your account has been created in the IT Helpdesk System. <br><br>` +
          `You can access the Helpdesk System using the following link: <a href="${process.env.REACT_CLIENT}">Click Here</a> <br><br>` +
          `Below are your account details: <br>` +
          `Username: <b>${user_name}</b> <br>` +
          `Temporary Password: <b>${pass_word}</b> <br><br>` +
          `You are advised to change your password upon your first login.<br><br>` +
          `If you have any questions, please contact the IT Department.<br><br>`;

        var start = `Hello <b>${username}</b>, <br><br>`;

        const mailOptions = {
          from: process.env.EMAIL,
          to: emp_email,
          subject: "Helpdesk System Account Created",
          html: start + body + end + privacy,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${emp_email} by ${current_user}`);
      }
    } catch (err) {
      console.log("Unable to send email: ", err);
    }
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
    return res
      .status(404)
      .json({ msg: "Unable to Register user! " + user_name });
  }
});
//Email registration
router.post("/register-email", async function (req, res, next) {
  try {
    console.log("Triggered /register-email");
    const { user_name, pass_word, emp_email, current_user } = req.body;

    console.log(
      `Email function triggered for ${user_name} by ${current_user}, sending to ${emp_email}`,
    );
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      secure: false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    //Setting assigned HD username
    var end = `Best regards,<br> Lepanto Helpdesk System`;
    var privacy =
      '<br><p style="color:gray;font-size:12px">Privacy Notice: </p>' +
      '<p style="color:gray;font-size:12px">The content of this email is intended for the person ' +
      "or entity to which it is addressed only. This email may contain confidential information. If you are not the person " +
      "to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly " +
      "prohibited.</p>";
    const username =
      user_name.charAt(0).toUpperCase() + user_name.slice(1).toLowerCase();

    var body =
      `This is to inform you that your account has been created in the IT Helpdesk System. <br><br>` +
      `You can access the Helpdesk System using the following link: "<a href="${process.env.REACT_CLIENT}" style=color: #1a73e8; text-decoration: none;>Click Here</a> <br><br>` +
      `Below are your account details: <br>` +
      `Username: <b>${user_name}</b> <br>` +
      `Temporary Password: <b>${pass_word}</b> <br><br>` +
      `You are advised to change your password upon your first login. Click your name at the top right corner, select <b>Profile</b>, and then click the <b>Change Password</b> button.<br><br>` +
      `If you have any questions or need further assistance, please do not hesitate to contact the IT Department.<br><br>`;

    var start = `Hello <b>${username}</b>, <br><br>`;
    var wholeEmail = start + body + end + privacy;

    const mailOptions = {
      from: process.env.EMAIL,
      to: emp_email,
      subject: "Helpdesk System Account Created",
      html: wholeEmail,
    };

    await transporter.sendMail(mailOptions);
    console.log(
      `Email sent to ${emp_email} regarding user creation by ${current_user}`,
    );
  } catch (err) {
    console.log("INTERNAL EROR: ", err);
  }
});

router.post("/update-user", async (req, res, next) => {
  const currentTimestamp = new Date();
  const {
    user_id,
    emp_FirstName,
    emp_LastName,
    user_name,
    emp_email,
    emp_tier,
    emp_phone,
    emp_role,
    emp_location,
    emp_department,
    emp_position,
    updated_by,
  } = req.body;

  try {
    await supabase
      .from("users_master")
      .update({
        emp_FirstName: emp_FirstName,
        emp_LastName: emp_LastName,
        user_name: user_name,
        emp_email: emp_email,
        emp_tier: emp_tier,
        emp_phone: emp_phone,
        emp_role: emp_role,
        emp_location: emp_location,
        emp_department: emp_department,
        emp_position: emp_position,
        updated_at: currentTimestamp,
        updated_by: updated_by,
      })
      .eq("user_id", user_id);

    await supabase.from("users_logs").insert({
      user_id: user_id,
      changes_made: `User details were updated for ${user_name} by ${updated_by}`,
      created_at: currentTimestamp,
      created_by: updated_by,
    });

    console.log(`User was updated ${user_name} with ID ${user_id}`);
    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
    res.status(500).json({ msg: "Unable to update user!" });
  }
});

router.post("/edit-password", async (req, res) => {
  try {
    const { user_id, new_password } = req.body;
    const currentTimestamp = new Date();

    // Fetch user info first
    const { data: user_info } = await supabase
      .from("users_master")
      .select("user_name")
      .eq("user_id", user_id)
      .single();

    // Update password
    await supabase
      .from("users_master")
      .update({
        pass_word: new_password,
        updated_at: currentTimestamp,
      })
      .eq("user_id", user_id);

    // Insert to logs
    await supabase.from("users_logs").insert({
      user_id: user_id,
      changes_made: `User ${user_info.user_name}, updated own password`,
      created_at: currentTimestamp,
      created_by: user_info.user_name,
    });

    res.status(200).json({ message: "User password updated successfully" });
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
    res.status(500).json({ msg: "Unable to update password!" });
  }
});

router.get("/get-all-users", async (req, res, next) => {
  try {
    const { data: getAllUsers, error } = await supabase
      .from("users_master")
      .select("*");

    res.json(getAllUsers);
    console.log("Triggered /get-all-users");
  } catch (err) {
    console.log("Unable to fetch all users");
  }
});

router.get("/get-by-username", async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from("users_master")
      .select("*")
      .eq("user_name", req.query.user_name)
      .single();

    res.json(user);
    console.log("Triggered /get-by-username");
  } catch (err) {
    console.log("GET BY USERNAME CONSOLE: ", err);
  }
});

router.get("/get-by-id", async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from("users_master")
      .select("*")
      .eq("user_id", req.query.user_id)
      .single();

    res.json(user);
    console.log("Triggered /get-by-id");
  } catch (err) {
    console.log("GET BY ID CONSOLE: ", err);
  }
});

router.post("/delete-user", async (req, res, next) => {
  try {
    const { user_id, deleted_by } = req.body;
    const currentTimestamp = new Date();

    // Fetch user info first
    const { data: userInfo } = await supabase
      .from("users_master")
      .select("user_name")
      .eq("user_id", user_id)
      .single();

    // Insert to logs
    await supabase.from("users_logs").insert({
      user_id: user_id,
      changes_made: `${userInfo.user_name} was deleted by ${deleted_by}`,
      created_at: currentTimestamp,
      created_by: deleted_by,
    });

    // Delete user
    await supabase.from("users_master").delete().eq("user_id", user_id);

    res.status(200).json({ message: "User deleted successfully" });
    console.log(`User with ID ${user_id} was deleted`);
  } catch (err) {
    console.log("DELETE USER CONSOLE: ", err);
    res.status(500).json({ msg: "Unable to delete user!" });
  }
});

router.get("/get-all-notes-usernames", async (req, res) => {
  try {
    const usernames = JSON.parse(req.query.user_name);

    const { data: users, error } = await supabase
      .from("users_master")
      .select("*")
      .in("user_name", usernames);

    res.json(users);
    console.log("Triggered /get-all-notes-usernames");
  } catch (err) {
    console.error("Error fetching multiple users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/get-all-review-usernames", async (req, res) => {
  try {
    const usernames = JSON.parse(req.query.user_name);

    const { data: users, error } = await supabase
      .from("users_master")
      .select("*")
      .in("user_name", usernames);

    res.json(users);
    console.log("Triggered /get-all-review-usernames");
  } catch (err) {
    console.error("Error fetching multiple users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/get-all-by-id", async (req, res) => {
  try {
    const user_id = JSON.parse(req.query.user_id);

    const { data: users, error } = await supabase
      .from("users_master")
      .select("*")
      .in("user_id", user_id);

    console.log("Triggered /get-all-by-id");
    res.json(users);
  } catch (err) {
    console.error("Error fetching multiple users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/get-all-notes", async (req, res) => {
  try {
    const { data: getAll, error } = await supabase
      .from("notes_master")
      .select("*");

    console.log("Triggered /get-all-notes");
    res.json(getAll);
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
  }
});

router.get("/get-all-pmsnotes", async (req, res) => {
  try {
    const { data: getAll, error } = await supabase
      .from("pmsnotes_master")
      .select("*");

    console.log("Triggered /get-all-pmsnotes");
    res.json(getAll);
  } catch (err) {
    console.log("INTERNAL ERROR: ", err);
  }
});

module.exports = router;
