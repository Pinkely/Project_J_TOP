const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const METADATA_FILE = path.join(__dirname, "files.json");

const app = express();
const port = 3001;

// --- [Middleware] ---
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// เสิร์ฟไฟล์หน้าเว็บจากโฟลเดอร์ frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// [เพิ่มใหม่] เก็บ notification queue ใน memory
const notifications = {};

// --- [Routes สำหรับ Login] ---
const loginRoutes = require("./login");
app.use("/", loginRoutes); // รองรับ POST /login

// --- [Config Multer สำหรับเก็บไฟล์] ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = `uploads`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// --- [API Endpoints] ---

// readMetaData
function readMetadata() {
  if (!fs.existsSync(METADATA_FILE)) return [];
  const data = fs.readFileSync(METADATA_FILE);
  return JSON.parse(data);
}

function saveMetadata(data) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2));
}

// POST upload — แยกโฟลเดอร์ตามคนรับ
app.post("/upload", upload.single("file"), (req, res) => {
  try {
    const { recipient, sender } = req.body;
    if (!req.file) return res.status(400).json({ error: "No file" });

    const oldPath = req.file.path;
    const targetDir = `./uploads/${recipient}`;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const newPath = `${targetDir}/from_${sender}_${req.file.originalname}`;
    fs.renameSync(oldPath, newPath);
    // ===== SAVE METADATA =====
    const files = readMetadata();

    const newFile = {
      id: Date.now().toString(),
      filename: req.file.originalname,
      path: newPath,
      size: req.file.size,
      sender: sender,
      recipient: recipient,
      uploadDate: new Date().toISOString(),
    };

    files.push(newFile);
    saveMetadata(files);
    console.log("METADATA SAVED");

    // [เพิ่มใหม่] สร้าง notification ให้คนรับ
    const msg = {
      message: `📁 ${sender} ส่งไฟล์ "${req.file.originalname}" มาให้คุณ`,
      time: Date.now(),
    };
    if (!notifications[recipient]) notifications[recipient] = [];
    notifications[recipient].push(msg);

    res.json({ message: "File sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

// GET files — admin เห็นทุกคน, user เห็นแค่ตัวเอง
app.get("/files", (req, res) => {
  const { username, role } = req.query;

  if (role === "admin") {
    if (!fs.existsSync("./uploads")) return res.json([]);
    const users = fs
      .readdirSync("./uploads")
      .filter((u) => fs.statSync(`./uploads/${u}`).isDirectory());
    let allFiles = [];
    users.forEach((user) => {
      const files = fs.readdirSync(`./uploads/${user}`);
      files.forEach((file) => allFiles.push({ user, file }));
    });
    res.json(allFiles);
  } else {
    const dir = `./uploads/${username}`;
    if (!fs.existsSync(dir)) return res.json([]);
    const files = fs.readdirSync(dir);
    res.json(files.map((file) => ({ user: username, file })));
  }
});

// GET download
app.get("/download/:username/:name", (req, res) => {
  const filePath = path.join(
    __dirname,
    "uploads",
    req.params.username,
    req.params.name,
  );
  res.download(filePath);
});

// DELETE
app.delete("/delete/:username/:name", (req, res) => {
  const file = `./uploads/${req.params.username}/${req.params.name}`;
  fs.unlink(file, (err) => {
    if (err) return res.status(500).json({ error: "Cannot delete file" });
    res.json({ message: "Deleted success" });
  });
});

// [เพิ่มใหม่] GET /notifications/:username (polling)
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
