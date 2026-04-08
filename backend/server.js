const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3001;

const METADATA_FILE = path.join(__dirname, "files.json");

// --- [Middleware] ---
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// เสิร์ฟไฟล์หน้าเว็บจากโฟลเดอร์ frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// เก็บ notification queue ใน memory
const notifications = {};

// --- [Routes สำหรับ Login] ---
const loginRoutes = require('./login');
app.use('/', loginRoutes);

// --- [Config Multer] ---
// เก็บไฟล์ใน memory ก่อน แล้วค่อย rename เอง (ไม่ให้ multer ตั้งชื่อซ้ำซ้อน)
const upload = multer({ storage: multer.memoryStorage() });

// --- [API Endpoints] ---

// POST /upload
app.post("/upload", upload.single("file"), (req, res) => {
    try {
        const { recipient, sender } = req.body;
        if (!req.file) return res.status(400).json({ error: "No file" });

        const targetDir = path.join(__dirname, "uploads", recipient);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // ชื่อไฟล์สุดท้าย: from_sender_ชื่อไฟล์เดิม (ไม่มี timestamp ซ้ำซ้อน)
        const finalName = `from_${sender}_${req.file.originalname}`;
        const finalPath = path.join(targetDir, finalName);
        fs.writeFileSync(finalPath, req.file.buffer);

        // สร้าง notification
        const msg = {
            message: `📁 ${sender} ส่งไฟล์ "${req.file.originalname}" มาให้คุณ`,
            time: Date.now()
        };
        if (!notifications[recipient]) notifications[recipient] = [];
        notifications[recipient].push(msg);

        res.json({ message: "File sent successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
});

// GET /files
app.get("/files", (req, res) => {
    const { username, role } = req.query;

    if (role === "admin") {
        const uploadsDir = path.join(__dirname, "uploads");
        if (!fs.existsSync(uploadsDir)) return res.json([]);
        const users = fs.readdirSync(uploadsDir).filter(u =>
            fs.statSync(path.join(uploadsDir, u)).isDirectory()
        );
        let allFiles = [];
        users.forEach(user => {
            const files = fs.readdirSync(path.join(uploadsDir, user));
            files.forEach(file => allFiles.push({ user, file }));
        });
        res.json(allFiles);
    } else {
        const dir = path.join(__dirname, "uploads", username);
        if (!fs.existsSync(dir)) return res.json([]);
        const files = fs.readdirSync(dir);
        res.json(files.map(file => ({ user: username, file })));
    }
});

// GET /download/:username/:name
app.get("/download/:username/:name", (req, res) => {
    const filePath = path.join(__dirname, "uploads", req.params.username, req.params.name);
    res.download(filePath);
});

// GET /preview/:username/:name  ← ต้องอยู่ก่อน app.listen()
app.get("/preview/:username/:name", (req, res) => {
    const filePath = path.join(__dirname, "uploads", req.params.username, req.params.name);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send("File not found");
    }
});

// DELETE /delete/:username/:name
app.delete("/delete/:username/:name", (req, res) => {
    const filePath = path.join(__dirname, "uploads", req.params.username, req.params.name);
    fs.unlink(filePath, (err) => {
        if (err) return res.status(500).json({ error: "Cannot delete file" });
        res.json({ message: "Deleted success" });
    });
});

// GET /notifications/:username
app.get("/notifications/:username", (req, res) => {
    const { username } = req.params;
    const msgs = notifications[username] || [];
    notifications[username] = [];
    res.json(msgs);
});

// --- [Start Server] ---
app.listen(port, () => {
    console.log(`Server is running on http://192.168.1.38:${port}`);
});