const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

// EMAIL CONFIG
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "tradedeskservice@gmail.com",
        pass: "cbpmlfttfdbesvjb"
    }
});

// REGISTER
router.post("/register", async (req, res) => {

    const { company, gst, phone, email, password } = req.body;

    if (!company || !email || !password) {
        return res.json({ success: false, message: "Required fields missing" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            `INSERT INTO users (company_name, gst_no, phone, email, password)
             VALUES ($1, $2, $3, $4, $5)`,
            [company, gst, phone, email, hashedPassword]
        );

        res.json({ success: true });

    } catch (err) {
        console.log(err);
        res.json({ success: false, message: "Email already exists" });
    }

});


// LOGIN
router.post("/login", async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ success: false, message: "Enter email & password" });
    }

    try {

        // 🔹 CHECK USER
        const user = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (user.rows.length === 0) {
            return res.json({ success: false, message: "User not found" });
        }

        const dbUser = user.rows[0];

        // 🔹 PASSWORD CHECK
        const isMatch = await bcrypt.compare(password, dbUser.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Wrong password" });
        }

        // ✅ SESSION STORE
        req.session.user = dbUser;

        res.json({
            success: true
        });

    } catch (err) {
        console.log(err);
        res.json({ success: false, message: "Server error" });
    }

});

router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login.html");
    });
});

router.get("/profile", async (req, res) => {

    if(!req.session.user){
        return res.json({ success: false });
    }

    const user = req.session.user;

    res.json({
        success: true,
        user: user
    });
});

router.get("/user-data", (req, res) => {

    if (!req.session.user) {
        return res.json({ success: false, message: "Not logged in" });
    }

    res.json({
        success: true,
        user: req.session.user
    });

});

router.post("/settings/update", async (req, res) => {

    const userId = req.session.user.id;

    const { company, gst, phone, address, includeCompany, darkMode } = req.body;

    try {

        // 🔹 1. UPDATE USERS TABLE
        await pool.query(
            `UPDATE users 
             SET company_name = $1, gst_no = $2, phone = $3, address = $4
             WHERE id = $5`,
            [company, gst, phone, address, userId]
        );

        // 🔹 2. UPDATE SETTINGS TABLE
        await pool.query(
            `INSERT INTO settings (user_id, include_company, dark_mode)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id)
             DO UPDATE SET
                include_company = EXCLUDED.include_company,
                dark_mode = EXCLUDED.dark_mode`,
            [userId, includeCompany, darkMode]
        );

        res.json({ success: true });

    } catch (err) {
        console.log(err);
        res.json({ success: false, message: "Server error" });
    }

});

router.get("/company-info", async (req, res) => {

    if (!req.session.user) {
        return res.status(401).json({ message: "Not logged in" });
    }

    const userId = req.session.user.id;

    try {

        // 🔹 USER DATA
        const user = await pool.query(
            `SELECT company_name, gst_no, phone, email, address 
             FROM users 
             WHERE id = $1`,
            [userId]
        );

        // 🔹 SETTINGS
        const settings = await pool.query(
            `SELECT include_company 
             FROM settings 
             WHERE user_id = $1`,
            [userId]
        );

        res.json({
            user: user.rows[0],
            includeCompany: settings.rows[0]?.include_company || false
        });

    } catch (err) {
        console.log(err);
        res.json({ success: false });
    }
});

router.get("/settings", async (req, res) => {
    try {
        const userId = req.session.user.id;

        const result = await db.query(
            "SELECT darkmode FROM settings WHERE user_id=$1",
            [userId]
        );

        res.json(result.rows[0]);

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
});

router.post("/update-settings", async (req, res) => {

    const userId = req.session.user.id;
    const { darkmode } = req.body;

    try {

        await db.query(
            "UPDATE settings SET darkmode=$1 WHERE user_id=$2",
            [darkmode, userId]
        );

        res.json({ success: true });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
});



// SEND OTP
router.post("/forgot-password", async (req, res) => {

    const { email } = req.body;

    try{

        // 1. CHECK USER
        const user = await pool.query(
            "SELECT * FROM users WHERE email=$1",
            [email]
        );

        if(user.rows.length === 0){
            return res.json({ success: false, message: "Email not registered" });
        }

        // 2. GENERATE OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

        // 3. EXPIRY
        const expiry = new Date(Date.now() + 5 * 60 * 1000);

        // 4. SAVE
        await pool.query(
            "UPDATE users SET otp_code=$1, otp_expiry=$2 WHERE email=$3",
            [otp, expiry, email]
        );

        // 5. SEND EMAIL
        await transporter.sendMail({
            from: "tradedeskservice@gmail.com",
            to: email,
            subject: "Password Reset OTP",
            html: `
                <h3>Password Reset</h3>
                <p>Your OTP is:</p>
                <h2>${otp}</h2>
                <p>Valid for 5 minutes</p>
            `
        });
        console.log("Entered Email :", email);
        console.log("DB Result :", user.rows);
        res.json({ success: true });


    }catch(err){
        console.log(err);
        res.status(500).json({ success: false });
    }
});

router.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;

    try {
        const result = await pool.query(
            "SELECT otp_code, otp_expiry FROM users WHERE email = $1",
            [email]
        );

        // ❌ user not found
        if(result.rows.length === 0){
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        const user = result.rows[0];

        // ❌ OTP mismatch
        if(user.otp_code !== otp){
            return res.json({
                success: false,
                message: "Invalid OTP ❌"
            });
        }

        // ❌ OTP expired
        if(new Date() > new Date(user.otp_expiry)){
            return res.json({
                success: false,
                message: "OTP expired ⏳"
            });
        }

        // ✅ CLEAR OTP
        await pool.query(
            "UPDATE users SET otp_code = NULL, otp_expiry = NULL WHERE email = $1",
            [email]
        );

        // ✅ OTP correct
        res.json({
            success: true
        });

    } catch (err) {
        console.log(err);
        res.json({
            success: false,
            message: "Server error"
        });
    }
});

router.post("/reset-password", async (req, res) => {

    const { email, password } = req.body;

    try {

        // ❌ Check if user exists
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if(result.rows.length === 0){
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        // 🔐 Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Update password
        await pool.query(
            "UPDATE users SET password = $1 WHERE email = $2",
            [hashedPassword, email]
        );

        res.json({
            success: true,
            message: "Password updated successfully ✅"
        });

    } catch (err) {
        console.log(err);
        res.json({
            success: false,
            message: "Server error"
        });
    }
});

module.exports = router;