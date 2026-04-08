const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// กำหนดตำแหน่งไฟล์สำหรับเก็บข้อมูลผู้ใช้
const USERS_FILE = path.join(__dirname, 'users.json');

// --- ฟังก์ชันช่วยเหลือสำหรับอ่านและเขียนไฟล์ JSON ---
// อ่านข้อมูลผู้ใช้ทั้งหมด
const getUsers = () => {
    // ถ้ายังไม่มีไฟล์ users.json ให้สร้างไฟล์ว่างๆ ขึ้นมาก่อน
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    }
    const data = fs.readFileSync(USERS_FILE);
    return JSON.parse(data);
};

// บันทึกข้อมูลผู้ใช้ลงไฟล์
const saveUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// --- 1. API สำหรับ Login ---
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();
    const found = users.find(u => u.username === username && u.password === password);

    if (found) {
        res.json({
            success: true,
            username: found.username,
            role: found.role
        });
    } else {
        res.status(401).json({ success: false, message: "Invalid username or password" });
    }
});

// --- 2. API สำหรับ Register ---
router.post('/register', (req, res) => {
    const { username, password } = req.body;

    // ตรวจสอบว่าส่งข้อมูลมาครบหรือไม่
    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Please provide username and password" });
    }

    const users = getUsers();

    // ตรวจสอบว่ามี username นี้ในระบบหรือยัง
    const userExists = users.find(u => u.username === username);
    if (userExists) {
        return res.status(409).json({ success: false, message: "Username already exists" });
    }

    // กำหนดสิทธิ์: ถ้าเป็นคนแรกที่สมัครให้เป็น 'admin' ถ้าไม่ใช่ให้เป็น 'user'
    // [แก้ไขใหม่] ค้นหาว่าในระบบมีคนที่เป็น 'admin' อยู่แล้วหรือยัง
    const hasAdmin = users.some(u => u.role === 'admin');

    // ถ้ามี admin แล้ว (dew) ให้คนที่สมัครใหม่เป็น 'user' ทั้งหมด
    // แต่ถ้ายังไม่มีใครเป็น admin เลย (ไฟล์ว่าง) คนแรกที่สมัครจะได้เป็น 'admin'
    const role = hasAdmin ? 'user' : 'admin';

    const newUser = {
        username: username,
        password: password,
        role: role
    };

    // บันทึกลง Array และเขียนทับลงไฟล์ JSON
    users.push(newUser);
    saveUsers(users);

    res.status(201).json({
        success: true,
        message: "Registration successful",
        user: { username: newUser.username, role: newUser.role } // ไม่ควรส่ง password กลับไป
    });
});

// --- 3. API สำหรับ Forget/Reset Password ---
router.post('/reset-password', (req, res) => {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
        return res.status(400).json({ success: false, message: "Please provide username and new password" });
    }

    const users = getUsers();

    // ค้นหา Index ของผู้ใช้ใน Array
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex === -1) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    // อัปเดตรหัสผ่านใหม่และบันทึกลงไฟล์
    users[userIndex].password = newPassword;
    saveUsers(users);

    res.json({ success: true, message: "Password updated successfully" });
});

module.exports = router;