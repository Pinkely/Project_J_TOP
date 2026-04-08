const API_URL = "http://192.168.1.27:3001";
let allFilesData = []; // เก็บข้อมูลไฟล์ทั้งหมดเพื่อใช้ตอน Search

// ตรวจสอบสถานะตอนโหลดหน้า
document.addEventListener("DOMContentLoaded", () => {
    const user = localStorage.getItem("username");
    if (!user) {
        window.location.href = "/login.html"; // ถ้าไม่ได้ล็อกอินให้เด้งกลับ
        return;
    }
    
    const userDisplay = document.getElementById("user");
    if (userDisplay) userDisplay.innerText = user;

    loadFiles();
});

// ออกจากระบบ
function logout() {
    localStorage.clear();
    window.location.href = "/login.html";
}

// อัปเดตชื่อไฟล์ตอนเลือก
function updateFileName() {
    const fileInput = document.getElementById("fileInput");
    const fileNameDisplay = document.getElementById("fileName");
    if (fileInput.files.length > 0) {
        fileNameDisplay.innerText = fileInput.files[0].name;
    } else {
        fileNameDisplay.innerText = "No file chosen";
    }
}

// โหลดไฟล์จาก Server และจัดกลุ่มตามชื่อผู้ใช้
async function loadFiles() {
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");
    
    try {
        const response = await fetch(`${API_URL}/files?username=${username}&role=${role}`);
        allFilesData = await response.json(); 
        renderFiles(allFilesData);
    } catch (error) {
        console.error("Error loading files:", error);
    }
}

// ฟังก์ชันแสดงผลไฟล์ลงบนหน้าเว็บ
function renderFiles(data) {
    const container = document.getElementById("fileListContainer");
    if (!container) return;
    
    container.innerHTML = ""; // ล้างหน้าจอก่อน

    if (data.length === 0) {
        container.innerHTML = "<p style='text-align: center; color: gray;'>No files available.</p>";
        return;
    }

    // 1. จัดกลุ่มข้อมูล (Group by user)
    const groupedFiles = data.reduce((acc, curr) => {
        if (!acc[curr.user]) acc[curr.user] = [];
        acc[curr.user].push(curr.file);
        return acc;
    }, {});

    // 2. สร้าง UI สำหรับแต่ละ User
    for (const [userFolder, files] of Object.entries(groupedFiles)) {
        
        // สร้างหัวข้อชื่อ User
        const header = document.createElement("h3");
        header.innerHTML = `📁 โฟลเดอร์ของ: <span style="color: #e91e63;">${userFolder}</span>`;
        header.style.marginTop = "20px";
        header.style.paddingBottom = "5px";
        header.style.borderBottom = "2px solid #f0f0f0";

        // สร้างลิสต์ไฟล์
        const ul = document.createElement("ul");
        ul.style.listStyleType = "none";
        ul.style.padding = "0";

        files.forEach(file => {
            const li = document.createElement("li");
            li.style.display = "flex";
            li.style.justifyContent = "space-between";
            li.style.alignItems = "center";
            li.style.padding = "10px";
            li.style.borderBottom = "1px solid #f9f9f9";

            li.innerHTML = `
                <span>📄 ${file}</span>
                <div>
                    <button onclick="downloadFile('${userFolder}', '${file}')" style="padding: 5px 10px; background-color: #2196F3; color: white; border: none; border-radius: 3px; cursor: pointer;">Download</button>
                    <button onclick="deleteFile('${userFolder}', '${file}')" style="padding: 5px 10px; background-color: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; margin-left: 5px;">Delete</button>
                </div>
            `;
            ul.appendChild(li);
        });

        container.appendChild(header);
        container.appendChild(ul);
    }
}

// อัปโหลดไฟล์ (ส่งได้หลายคนตาม Checkbox)
async function uploadFile(event) {
    event.preventDefault();
    const fileInput = document.getElementById("fileInput");
    const statusText = document.getElementById("uploadStatus");
    const sender = localStorage.getItem("username");

    // ดึงรายชื่อคนที่ถูกติ๊กเลือก
    const checkboxes = document.querySelectorAll('#recipientList input[type="checkbox"]:checked');
    const recipients = Array.from(checkboxes).map(cb => cb.value);

    if (fileInput.files.length === 0) {
        alert("Please select a file to upload.");
        return;
    }
    if (recipients.length === 0) {
        alert("Please select at least one recipient.");
        return;
    }

    const file = fileInput.files[0];
    statusText.innerText = "Uploading...";
    statusText.style.color = "blue";

    try {
        // วนลูปส่งไฟล์ให้ทีละคนที่เลือก
        for (const recipient of recipients) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("sender", sender);
            formData.append("recipient", recipient);

            await fetch(`${API_URL}/upload`, {
                method: "POST",
                body: formData
            });
        }

        statusText.innerText = "Upload successful!";
        statusText.style.color = "green";
        fileInput.value = ""; // ล้างช่องเลือกไฟล์
        document.getElementById("fileName").innerText = "No file chosen";
        
        loadFiles(); // โหลดข้อมูลใหม่
    } catch (error) {
        console.error("Upload error:", error);
        statusText.innerText = "Upload failed.";
        statusText.style.color = "red";
    }
}

// ดาวน์โหลดไฟล์
function downloadFile(userFolder, fileName) {
    window.open(`${API_URL}/download/${userFolder}/${fileName}`, '_blank');
}

// ลบไฟล์
async function deleteFile(userFolder, fileName) {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;

    try {
        const response = await fetch(`${API_URL}/delete/${userFolder}/${fileName}`, {
            method: "DELETE"
        });
        
        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            loadFiles(); // โหลดใหม่หลังลบเสร็จ
        } else {
            alert("Error: " + result.error);
        }
    } catch (error) {
        console.error("Delete error:", error);
    }
}

// ค้นหาไฟล์ (ช่อง Search Box)
function searchFiles() {
    const searchText = document.getElementById("searchBox").value.toLowerCase();
    if (searchText === "") {
        renderFiles(allFilesData); // ถ้าไม่ได้พิมพ์อะไร ให้แสดงทั้งหมด
        return;
    }

    // กรองเอาเฉพาะไฟล์ที่มีชื่อตรงกับที่ค้นหา
    const filtered = allFilesData.filter(item => item.file.toLowerCase().includes(searchText));
    renderFiles(filtered);
}