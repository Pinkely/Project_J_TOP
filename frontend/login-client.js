const API_URL = "http://192.168.1.38:3001";

// --- ฟังก์ชันจัดการ Modal (Popup) ---
// เพิ่มพารามิเตอร์ hideButton เพื่อเลือกว่าจะซ่อนปุ่ม OK หรือไม่
function openModal(title, message, hideButton = false) {
    document.getElementById("modalTitle").textContent = title;
    document.getElementById("modalMessage").textContent = message;
    document.getElementById("successModal").classList.add("active");

    const modalBtn = document.querySelector(".modal-btn");
    if (hideButton) {
        modalBtn.style.display = "none"; // ซ่อนปุ่ม
    } else {
        modalBtn.style.display = "inline-block"; // แสดงปุ่มตามปกติ
    }
}

function closeModal() {
    document.getElementById("successModal").classList.remove("active");
    // หลังจากปิด Modal ให้กลับไปหน้า Login เสมอ
    switchView('loginView');
}

// ฟังก์ชันสลับหน้าต่างและล้างข้อความ Error
const switchView = (viewId) => {
    document.getElementById("loginView").style.display = "none";
    document.getElementById("registerView").style.display = "none";
    document.getElementById("resetView").style.display = "none";

    document.getElementById(viewId).style.display = "block";
    document.getElementById("statusMessage").textContent = ""; // ล้าง Error เก่า
}

// 1. ฟังก์ชัน Login (อัปเดตเพิ่ม Popup และ Cooldown)
const login = async () => {
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;
    const statusEl = document.getElementById("statusMessage");

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            statusEl.textContent = "";
            localStorage.setItem("username", data.username);
            localStorage.setItem("role", data.role);

            // 1. เรียก Popup แจ้งว่าสำเร็จ และสั่งซ่อนปุ่ม OK (ส่งค่า true)
            openModal("Welcome! 💖", "Login successful! Redirecting...", true);

            // 2. ตั้งเวลา Cooldown 2 วินาที (2000 ms) ก่อนเปลี่ยนหน้า
            setTimeout(() => {
                window.location.href = (data.role === "admin") ? "admin.html" : "index.html";
            }, 500);

        } else {
            statusEl.textContent = data.message || "Invalid credentials";
        }
    } catch (err) {
        statusEl.textContent = "Server Connection Failed";
    }
}

// 2. ฟังก์ชัน Register
const register = async () => {
    const username = document.getElementById("reg-username").value;
    const password = document.getElementById("reg-password").value;
    const statusEl = document.getElementById("statusMessage");

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            statusEl.textContent = "";
            // ยิง Popup สำเร็จ (ไม่ได้ส่งค่า hideButton จึงแสดงปุ่ม OK ปกติ)
            openModal("YAY! ✨", "Registration successful! You can now login.");
        } else {
            statusEl.textContent = data.message || "Registration failed";
        }
    } catch (err) {
        statusEl.textContent = "Server Connection Failed";
    }
}

// 3. ฟังก์ชัน Reset Password
const resetPassword = async () => {
    const username = document.getElementById("reset-username").value;
    const newPassword = document.getElementById("reset-password").value;
    const statusEl = document.getElementById("statusMessage");

    try {
        const response = await fetch(`${API_URL}/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            statusEl.textContent = "";
            // ยิง Popup สำเร็จ!
            openModal("Locked in! 🔒", "Password updated successfully!");
        } else {
            statusEl.textContent = data.message || "Reset failed";
        }
    } catch (err) {
        statusEl.textContent = "Server Connection Failed";
    }
}