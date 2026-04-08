const serverURL = "http://192.168.1.30:3002";

const username = localStorage.getItem("username");
const role = localStorage.getItem("role");

// แสดง username บนหน้า
const userElement = document.getElementById("user");
if (userElement) {
    userElement.textContent = username;
}

const logout = () => {
    localStorage.clear();
    alert("Logout successful");
    window.location.href = "login.html";
}

console.log("Restored User:", username, "Role:", role);

window.onload = () => {
    if (username) {
        fetchFileList();
        setupFilePreview(); // เรียกตั้ง preview ตอนเลือกไฟล์
    } else {
        alert("กรุณา Login ก่อนเข้าใช้งาน");
        window.location.href = "login.html";
    }
};

// =============================
// Preview รูปตอนเลือกไฟล์ (ก่อน Upload)
// =============================
function setupFilePreview() {
    const fileInput = document.getElementById("fileInput");
    if (!fileInput) return;

    // สร้าง container สำหรับแสดงรูป preview
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
    previewLabel.style.cssText = `
        font-size: 13px;
        color: #666;
        margin: 0;
    `;

    previewBox.appendChild(previewImg);
    previewBox.appendChild(previewLabel);

    // แทรก previewBox หลัง fileInput
    fileInput.parentNode.insertBefore(previewBox, fileInput.nextSibling);

    // เมื่อเลือกไฟล์
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];

        // อัปเดต "My File / File :" ถ้ามี element นั้น
        const fileNameEl = document.getElementById("fileName");
        if (fileNameEl) fileNameEl.textContent = file ? file.name : "No file chosen";

        if (!file) {
            previewBox.style.display = "none";
            previewImg.src = "";
            return;
        }

        // ถ้าเป็นรูปภาพ → แสดง preview
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                previewLabel.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
                previewBox.style.display = "flex";
            };
            reader.readAsDataURL(file);
        } else {
            // ถ้าไม่ใช่รูป → แสดงชื่อไฟล์ + ไอคอนแทน
            previewImg.src = "";
            previewImg.style.display = "none";
            previewLabel.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
            previewBox.style.display = "flex";
        }
    });
}

// =============================
// Fetch และ render ไฟล์
// =============================
function fetchFileList() {
    if (!username || !role) return;
    fetch(`${serverURL}/files?username=${username}&role=${role}`)
        .then(res => res.json())
        .then(files => {
            const fileList = document.getElementById("fileList");

            fileList.innerHTML = files.map(({ user, file }) => `
                <li data-user="${user}" data-file="${file}"
                    style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee; transition: background 0.2s;">
                    <span style="cursor: default;">${role === 'admin' ? `[${user}] ` : ''}${file}</span>
                    <div>
                        <button class="btn-download"
                            style="padding: 5px 10px; background-color: #008CBA; color: white; border: none; cursor: pointer; border-radius: 5px; margin-right: 5px;">
                            Download
                        </button>
                        <button class="btn-delete"
                            style="padding: 5px 10px; background-color: #f44336; color: white; border: none; cursor: pointer; border-radius: 5px;">
                            Delete
                        </button>
                    </div>
                </li>
            `).join("");

            fileList.querySelectorAll("li").forEach(li => {
                const u = li.dataset.user;
                const f = li.dataset.file;

                li.addEventListener("mouseenter", () => {
                    li.style.backgroundColor = "#f9a8d433";
                    showHoverPreview(u, f);
                });
                li.addEventListener("mousemove", moveHoverPreview);
                li.addEventListener("mouseleave", () => {
                    li.style.backgroundColor = "transparent";
                    hideHoverPreview();
                });

                li.querySelector(".btn-download").addEventListener("click", () => downloadFile(u, f));
                li.querySelector(".btn-delete").addEventListener("click", () => deleteFile(u, f));
            });
        })
        .catch(err => console.error("Fetch error:", err));
}

// =============================
// Upload
// =============================
const uploadFile = async (event) => {
    event.preventDefault();
    const fileInput = document.getElementById("fileInput");
    const sender = localStorage.getItem("username");
    if (!fileInput.files[0]) return;

    const recipients = [...document.querySelectorAll("#recipientList input:checked")]
        .map(el => el.value);

    if (recipients.length === 0) {
        alert("กรุณาเลือกผู้รับอย่างน้อย 1 คน");
        return;
    }

    for (const recipient of recipients) {
        const formData = new FormData();
        formData.append("file", fileInput.files[0]);
        formData.append("recipient", recipient);
        formData.append("sender", sender);

        await fetch(`${serverURL}/upload`, {
            method: "POST",
            body: formData
        });
    }

    alert("ส่งไฟล์ให้ " + recipients.join(", ") + " เรียบร้อย!");
    fetchFileList();
    fileInput.value = "";

    // ล้าง preview หลัง upload เสร็จ
    const previewBox = document.getElementById("uploadPreviewBox");
    const previewImg = document.getElementById("uploadPreviewImg");
    if (previewBox) previewBox.style.display = "none";
    if (previewImg) previewImg.src = "";
};

// =============================
// Download & Delete
// =============================
function downloadFile(user, fileName) {
    window.location.href = `${serverURL}/download/${user}/${fileName}`;
}

function deleteFile(user, fileName) {
    fetch(`${serverURL}/delete/${user}/${fileName}`, { method: "DELETE" })
        .then(res => res.json())
        .then(data => {
            console.log(data.message);
            fetchFileList();
        });
}

// =============================
// Search Box (admin page)
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
// Notification / Toast System
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