const serverURL = "http://192.168.1.38:3001";

const username = localStorage.getItem("username");
const role = localStorage.getItem("role");
//let allFiles = [];

// แสดง username บนหน้า
const userElement = document.getElementById("user");
if (userElement) {
    userElement.textContent = username;
}
const logout = () => {
    localStorage.clear();
    window.location.href = "/login.html";
}

// เช็คใน Console ว่าค่ากลับมาจริงไหม
console.log("Restored User:", username, "Role:", role);

// ถ้าหน้าเว็บโหลดเสร็จ ให้เรียกแสดงรายการไฟล์ทันที
window.onload = () => {
    if (username) {
        fetchFileList();
    } else {
        fileNameDisplay.innerText = "No file chosen";
    }
};


// Fetch และ render ไฟล์
function fetchFileList() {
    if (!username || !role) return; // กัน Error ถ้ายังไม่ Login
    fetch(`${serverURL}/files?username=${username}&role=${role}`)
        .then(res => res.json())
        .then(files => {
            const fileList = document.getElementById("fileList");
            fileList.innerHTML = files.map(({ user, file }) => `
                <li style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
                    <span>${role === 'admin' ? `[${user}] ` : ''}${file}</span>
                    <div>
                        <button onclick="downloadFile('${user}', '${file}')"
                            style="padding: 5px 10px; background-color: #008CBA; color: white; border: none; cursor: pointer; border-radius: 5px; margin-right: 5px;">
                            Download
                        </button>
                        <button onclick="deleteFile('${user}', '${file}')"
                            style="padding: 5px 10px; background-color: #f44336; color: white; border: none; cursor: pointer; border-radius: 5px;">
                            Delete
                        </button>
                    </div>
                </li>
            `).join("")
        })
        .catch(err => console.error("Fetch error:", err));
}

const uploadFile = async (event) => {
    event.preventDefault();
    const fileInput = document.getElementById("fileInput");
    const statusText = document.getElementById("uploadStatus");
    const sender = localStorage.getItem("username");

    // [แก้] ดึง checkbox ที่ติ๊กไว้ทั้งหมด แทนการดึงจาก select คนเดียว
    const recipients = [...document.querySelectorAll("#recipientList input:checked")]
        .map(el => el.value);

    if (fileInput.files.length === 0) {
        alert("Please select a file to upload.");
        return;
    }
    if (recipients.length === 0) {
        alert("Please select at least one recipient.");
        return;
    }

    // [แก้] วนลูปส่งให้ทุกคนที่เลือก ทีละ request
    for (const recipient of recipients) {
        const formData = new FormData();
        formData.append("file", fileInput.files[0]);
        formData.append("recipient", recipient);
        formData.append("sender", sender);

            await fetch(`${API_URL}/upload`, {
                method: "POST",
                body: formData
            });
        }

    alert("ส่งไฟล์ให้ " + recipients.join(", ") + " เรียบร้อย!");
    fetchFileList();
    fileInput.value = "";
};


// Upload แบบเก่า (ยังไม่แยกคนรับ)
// function uploadFile() {
//     const fileInput = document.getElementById("fileInput");
//     const file = fileInput.files[0];
//     if (!file) return;

//     document.getElementById("fileName").textContent = file.name;

//     const formData = new FormData();
//     formData.append("file", file);

//     fetch(`${serverURL}/upload?username=${username}`, {
//         method: "POST",
//         body: formData
//     })
//         .then(res => res.json())
//         .then(data => {
//             document.getElementById("uploadStatus").textContent = data.message;
//             fetchFileList();
//         });
// }

// Download
function downloadFile(user, fileName) {
    window.location.href = `${serverURL}/download/${user}/${fileName}`;
}

// Delete
function deleteFile(user, fileName) {
    fetch(`${serverURL}/delete/${user}/${fileName}`, { method: "DELETE" })
        .then(res => res.json())
        .then(data => {
            console.log(data.message);
            fetchFileList();
        });
}

// =============================
// [แก้บั๊ก] ลบ block searchBox อันแรกออก เพราะไม่มี null check
// เหลือแค่อันนี้อันเดียวที่เช็ค if (searchBox) ก่อนเรียกใช้
// =============================
const searchBox = document.getElementById("searchBox");
if (searchBox) {
    searchBox.addEventListener("input", function () {
        const keyword = this.value.toLowerCase();
        const items = document.querySelectorAll("#fileList li");
        items.forEach(li => {
            const text = li.textContent.toLowerCase();
            li.style.display = text.includes(keyword) ? "" : "none";
        });
    });
}

// =============================
// [เพิ่มใหม่] Notification System
// สร้าง toast container ลอยอยู่มุมบนขวาของหน้า
// =============================
const toastContainer = document.createElement("div");
toastContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
`;
document.body.appendChild(toastContainer);

// ฟังก์ชันสร้าง toast popup แสดง 4 วินาทีแล้วหายไปเอง
function showToast(message) {
    const toast = document.createElement("div");
    toast.style.cssText = `
        background: #323232;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-size: 14px;
        max-width: 300px;
        word-break: break-word;
        opacity: 1;
        transition: opacity 0.5s ease;
    `;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => { toast.style.opacity = "0"; }, 3500);
    setTimeout(() => { toast.remove(); }, 4000);
}

// =============================
// [เพิ่มใหม่] Polling — เรียก /notifications ทุก 5 วิ
// ถ้ามี notification ใหม่จะแสดง toast และ refresh list อัตโนมัติ
// =============================
if (username) {
    setInterval(async () => {
        try {
            const res = await fetch(`${serverURL}/notifications/${username}`);
            const msgs = await res.json();
            if (msgs.length > 0) {
                msgs.forEach(n => showToast(n.message));
                fetchFileList();
            }
        } catch (err) {
            console.error("Notification polling error:", err);
        }
    }, 5000);
}

// =============================
// Image Hover Preview (เลื่อนเมาส์ไปที่ไฟล์ใน list)
// =============================
const hoverPreviewContainer = document.createElement("div");
hoverPreviewContainer.style.cssText = `
    position: fixed;
    display: none;
    z-index: 10000;
    background: white;
    padding: 6px;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.25);
    pointer-events: none;
`;
const hoverPreviewImage = document.createElement("img");
hoverPreviewImage.style.cssText = `
    max-width: 250px;
    max-height: 250px;
    display: block;
    border-radius: 4px;
    object-fit: cover;
`;
hoverPreviewContainer.appendChild(hoverPreviewImage);
document.body.appendChild(hoverPreviewContainer);

function showHoverPreview(user, fileName) {
    if (fileName.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
        hoverPreviewImage.src = `${serverURL}/preview/${user}/${fileName}`;
        hoverPreviewContainer.style.display = "block";
    }
}

function moveHoverPreview(event) {
    if (hoverPreviewContainer.style.display === "block") {
        hoverPreviewContainer.style.left = (event.clientX + 15) + "px";
        hoverPreviewContainer.style.top = (event.clientY + 15) + "px";
    }
}

function hideHoverPreview() {
    hoverPreviewContainer.style.display = "none";
    hoverPreviewImage.src = "";
}