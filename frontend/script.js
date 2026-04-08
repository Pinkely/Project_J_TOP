const API_URL = "http://192.168.1.27:3001";
let allFilesData = [];

// =============================
// Init
// =============================
document.addEventListener("DOMContentLoaded", () => {
    const user = localStorage.getItem("username");
    if (!user) {
        window.location.href = "/login.html";
        return;
    }

    const userDisplay = document.getElementById("user");
    if (userDisplay) userDisplay.innerText = user;

    loadFiles();
    setupFilePreview();
    setupSearchBox();
});

// =============================
// Auth
// =============================
function logout() {
    localStorage.clear();
    window.location.href = "/login.html";
}

// =============================
// Preview รูปตอนเลือกไฟล์ (ก่อน Upload)
// =============================
function setupFilePreview() {
    const fileInput = document.getElementById("fileInput");
    if (!fileInput) return;

    const previewBox = document.createElement("div");
    previewBox.id = "uploadPreviewBox";
    previewBox.style.cssText = `
        margin-top: 12px;
        display: none;
        flex-direction: column;
        align-items: center;
        gap: 6px;
    `;

    const previewImg = document.createElement("img");
    previewImg.id = "uploadPreviewImg";
    previewImg.style.cssText = `
        max-width: 220px;
        max-height: 220px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.15);
        object-fit: cover;
    `;

    const previewLabel = document.createElement("p");
    previewLabel.id = "uploadPreviewLabel";
    previewLabel.style.cssText = `font-size: 13px; color: #666; margin: 0;`;

    previewBox.appendChild(previewImg);
    previewBox.appendChild(previewLabel);
    fileInput.parentNode.insertBefore(previewBox, fileInput.nextSibling);

    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];

        const fileNameEl = document.getElementById("fileName");
        if (fileNameEl) fileNameEl.textContent = file ? file.name : "No file chosen";

        if (!file) {
            previewBox.style.display = "none";
            previewImg.src = "";
            return;
        }

        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.style.display = "block";
                previewImg.src = e.target.result;
                previewLabel.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
                previewBox.style.display = "flex";
            };
            reader.readAsDataURL(file);
        } else {
            previewImg.src = "";
            previewImg.style.display = "none";
            previewLabel.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
            previewBox.style.display = "flex";
        }
    });
}

// =============================
// Load & Render ไฟล์
// =============================
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

// แสดงไฟล์แบบแยกหัวข้อตาม user
function renderFiles(data) {
    // รองรับทั้ง admin.html (id="fileList") และ index.html (id="fileListContainer")
    const container = document.getElementById("fileList") || document.getElementById("fileListContainer");
    const noFiles = document.getElementById("no-files");

    if (!container) return;
    container.innerHTML = "";

    if (data.length === 0) {
        if (noFiles) {
            noFiles.style.display = "block";
        } else {
            container.innerHTML = "<p style='text-align:center;color:gray;'>No files available.</p>";
        }
        return;
    }

    if (noFiles) noFiles.style.display = "none";

    // จัดกลุ่มตาม user
    const grouped = data.reduce((acc, curr) => {
        if (!acc[curr.user]) acc[curr.user] = [];
        acc[curr.user].push(curr.file);
        return acc;
    }, {});

    // สร้าง UI แยกหัวข้อ
    container.innerHTML = Object.entries(grouped).map(([user, files]) => `
        <div class="user-group">
            <div class="user-group-header">
                <span>👤</span>
                <h4>${user}</h4>
                <span class="file-count">${files.length} file${files.length > 1 ? 's' : ''}</span>
            </div>
            <ul>
                ${files.map(file => `
                    <li data-user="${user}" data-file="${file}">
                        <span class="file-name">📄 ${file}</span>
                        <div class="file-actions">
                            <button class="btn-download" onclick="downloadFile('${user}', '${file}')">⬇ Download</button>
                            <button class="btn-delete" onclick="deleteFile('${user}', '${file}')">🗑 Delete</button>
                        </div>
                    </li>
                `).join('')}
            </ul>
        </div>
    `).join('');

    // ผูก hover preview กับทุก li
    container.querySelectorAll("li[data-user]").forEach(li => {
        const u = li.dataset.user;
        const f = li.dataset.file;
        li.addEventListener("mouseenter", () => showHoverPreview(u, f));
        li.addEventListener("mousemove", moveHoverPreview);
        li.addEventListener("mouseleave", hideHoverPreview);
    });
}

// =============================
// Upload
// =============================
async function uploadFile(event) {
    event.preventDefault();
    const fileInput = document.getElementById("fileInput");
    const statusText = document.getElementById("uploadStatus");
    const sender = localStorage.getItem("username");

    const recipients = [...document.querySelectorAll('#recipientList input[type="checkbox"]:checked')]
        .map(cb => cb.value);

    if (!fileInput.files[0]) {
        alert("Please select a file to upload.");
        return;
    }
    if (recipients.length === 0) {
        alert("กรุณาเลือกผู้รับอย่างน้อย 1 คน");
        return;
    }

    if (statusText) { statusText.innerText = "Uploading..."; statusText.style.color = "blue"; }

    try {
        for (const recipient of recipients) {
            const formData = new FormData();
            formData.append("file", fileInput.files[0]);
            formData.append("sender", sender);
            formData.append("recipient", recipient);
            await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
        }

        if (statusText) { statusText.innerText = "Upload successful!"; statusText.style.color = "green"; }

        fileInput.value = "";
        const fileNameEl = document.getElementById("fileName");
        if (fileNameEl) fileNameEl.innerText = "No file chosen";

        // ล้าง preview
        const previewBox = document.getElementById("uploadPreviewBox");
        const previewImg = document.getElementById("uploadPreviewImg");
        if (previewBox) previewBox.style.display = "none";
        if (previewImg) previewImg.src = "";

        loadFiles();
    } catch (error) {
        console.error("Upload error:", error);
        if (statusText) { statusText.innerText = "Upload failed."; statusText.style.color = "red"; }
    }
}

// =============================
// Download & Delete
// =============================
function downloadFile(userFolder, fileName) {
    window.open(`${API_URL}/download/${userFolder}/${fileName}`, '_blank');
}

async function deleteFile(userFolder, fileName) {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
        const response = await fetch(`${API_URL}/delete/${userFolder}/${fileName}`, { method: "DELETE" });
        const result = await response.json();
        if (response.ok) {
            allFilesData = allFilesData.filter(f => !(f.user === userFolder && f.file === fileName));
            searchFiles();
        } else {
            alert("Error: " + result.error);
        }
    } catch (error) {
        console.error("Delete error:", error);
    }
}

// =============================
// Search
// =============================
function setupSearchBox() {
    const searchBox = document.getElementById("searchBox");
    if (searchBox) searchBox.addEventListener("input", searchFiles);
}

function searchFiles() {
    const searchBox = document.getElementById("searchBox");
    const keyword = searchBox ? searchBox.value.toLowerCase() : "";

    if (!keyword) {
        renderFiles(allFilesData);
        return;
    }

    const filtered = allFilesData.filter(item =>
        item.file.toLowerCase().includes(keyword) ||
        item.user.toLowerCase().includes(keyword)
    );
    renderFiles(filtered);
}

// =============================
// Toast Notification
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

// Polling notification ทุก 5 วินาที
const _notifUser = localStorage.getItem("username");
if (_notifUser) {
    setInterval(async () => {
        try {
            const res = await fetch(`${API_URL}/notifications/${_notifUser}`);
            const msgs = await res.json();
            if (msgs.length > 0) {
                msgs.forEach(n => showToast(n.message));
                loadFiles();
            }
        } catch (err) {
            console.error("Notification polling error:", err);
        }
    }, 5000);
}

// =============================
// Image Hover Preview
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
        hoverPreviewImage.src = `${API_URL}/preview/${user}/${fileName}`;
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