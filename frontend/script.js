const API_URL = "http://192.168.1.46:3001";
let allFilesData = [];
let _rowDataMap = {}; // key: 'user__file' → item object
let sortKey = 'file';
let sortDir = 'asc';

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
    setupFileInput();
    setupSearchBox();
    loadUserList();
});

// =============================
// Auth
// =============================
function logout() {
    localStorage.clear();
    window.location.href = "/login.html";
}

// =============================
// File Input + Drag & Drop
// =============================
function setupFileInput() {
    const fileInput = document.getElementById("fileInput");
    if (!fileInput) return;

    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        updateFilePreview(file);
    });
}

function updateFilePreview(file) {
    const area = document.getElementById("filePreviewArea");
    const icon = document.getElementById("filePreviewIcon");
    const name = document.getElementById("filePreviewName");
    const size = document.getElementById("filePreviewSize");
    if (!area) return;
    if (!file) {
        area.style.display = "none";
        return;
    }
    icon.textContent = getFileIcon(file.name);
    name.textContent = file.name;
    size.textContent = formatSize(file.size);
    area.style.display = "flex";
}

function clearFileInput() {
    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.value = "";
    updateFilePreview(null);
}

function handleDragOver(event) {
    event.preventDefault();
    const zone = document.getElementById("dropZone");
    if (zone) { zone.style.background = "#ede9fe"; zone.style.borderColor = "#7c3aed"; }
}

function handleDragLeave(event) {
    const zone = document.getElementById("dropZone");
    if (zone) { zone.style.background = "#f5f3ff"; zone.style.borderColor = "#a5b4fc"; }
}

function handleDrop(event) {
    event.preventDefault();
    handleDragLeave(event);
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const fileInput = document.getElementById("fileInput");
        const dt = new DataTransfer();
        dt.items.add(files[0]);
        fileInput.files = dt.files;
        updateFilePreview(files[0]);
    }
}

// =============================
// Load User List (used by Share Modal)
// =============================
async function loadUserList() {
    // ไม่ต้องทำอะไรแล้ว — user list โหลดตอนเปิด share modal แทน
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
        _rowDataMap = {};
        allFilesData.forEach(item => { _rowDataMap[item.user + '__' + item.file] = item; });
        renderFiles(allFilesData);
    } catch (error) {
        console.error("Error loading files:", error);
    }
}

// =============================
// Helpers
// =============================
function formatSize(bytes) {
    if (!bytes || bytes === 0) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        pdf: '📄', png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', webp: '🖼️',
        zip: '🗜️', rar: '🗜️', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
        ppt: '📋', pptx: '📋', mp4: '🎬', mp3: '🎵', txt: '📃'
    };
    return icons[ext] || '📁';
}

function getSortIcon(key) {
    const active = sortKey === key;
    const icon = active ? (sortDir === 'asc' ? '↑' : '↓') : '↕';
    const opacity = active ? '1' : '0.35';
    return `<span class="sort-icon-el" style="opacity:${opacity}">${icon}</span>`;
}

// =============================
// Sort
// =============================
function setSort(key) {
    if (sortKey === key) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
        sortKey = key;
        sortDir = 'asc';
    }

    // อัปเดต icon ทุก column header
    document.querySelectorAll('.sortable[data-sort]').forEach(el => {
        const k = el.getAttribute('data-sort');
        const icon = el.querySelector('.sort-icon-el');
        if (!icon) return;
        if (k === sortKey) {
            icon.textContent = sortDir === 'asc' ? '↑' : '↓';
            icon.style.opacity = '1';
        } else {
            icon.textContent = '↕';
            icon.style.opacity = '0.35';
        }
    });

    // sort rows ใน each .file-table แบบ in-place
    const container = document.getElementById("fileList") || document.getElementById("fileListContainer");
    if (!container) return;
    container.querySelectorAll('.file-table').forEach(table => {
        const rows = [...table.querySelectorAll('.file-row')];
        if (!rows.length) return;
        rows.sort((a, b) => {
            const aData = _rowDataMap[a.dataset.user + '__' + a.dataset.file] || {};
            const bData = _rowDataMap[b.dataset.user + '__' + b.dataset.file] || {};
            let va = aData[sortKey] ?? '';
            let vb = bData[sortKey] ?? '';
            if (sortKey === 'size') return sortDir === 'asc' ? va - vb : vb - va;
            if (sortKey === 'uploadTime') return sortDir === 'asc'
                ? new Date(va) - new Date(vb)
                : new Date(vb) - new Date(va);
            return sortDir === 'asc'
                ? va.toString().localeCompare(vb.toString())
                : vb.toString().localeCompare(va.toString());
        });
        rows.forEach(row => table.appendChild(row));
    });
}

function sortItems(items) {
    return [...items].sort((a, b) => {
        let va = a[sortKey] ?? '';
        let vb = b[sortKey] ?? '';
        if (sortKey === 'size') {
            return sortDir === 'asc' ? va - vb : vb - va;
        }
        if (sortKey === 'uploadTime') {
            return sortDir === 'asc'
                ? new Date(va) - new Date(vb)
                : new Date(vb) - new Date(va);
        }
        return sortDir === 'asc'
            ? va.toString().localeCompare(vb.toString())
            : vb.toString().localeCompare(va.toString());
    });
}

// =============================
// Collapse / Expand
// =============================
function toggleGroup(header) {
    const table = header.nextElementSibling;
    const arrow = header.querySelector('.collapse-arrow');
    const isOpen = table.style.display !== 'none';
    table.style.display = isOpen ? 'none' : 'flex';
    arrow.textContent = isOpen ? '▷' : '▽';
}

// =============================
// Render ไฟล์
// =============================
function renderFiles(data) {
    const container = document.getElementById("fileList") || document.getElementById("fileListContainer");
    const noFiles = document.getElementById("no-files");

    // กรองข้อมูลอีกทีสำหรับ user ปกติ (ถ้าเป็น admin จะเห็นหมดอยู่แล้ว)
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");
    if (role !== 'admin') {
        data = data.filter(item => item.user === username);
    }
    // -----------------------

    if (!container) return;
    container.innerHTML = "";

    if (data.length === 0) {
        if (noFiles) {
            noFiles.style.display = "block";
        } else {
            container.innerHTML = `<div class="empty-state"><span>📂</span><p>No files available.</p></div>`;
        }
        return;
    }

    if (noFiles) noFiles.style.display = "none";

    // จัดกลุ่มตาม user
    const grouped = data.reduce((acc, curr) => {
        if (!acc[curr.user]) acc[curr.user] = [];
        acc[curr.user].push(curr);
        return acc;
    }, {});

    // helper สร้าง HTML ของ group
    function buildGroup(label, avatar, items, isAll = false) {
        const sorted = sortItems(items);
        const avatarHTML = isAll
            ? `<div class="user-avatar" style="background:#6366f1">★</div>`
            : `<div class="user-avatar">${avatar}</div>`;
        return `
        <div class="user-group ${isAll ? 'user-group-all' : ''}">
            <div class="user-group-header" onclick="toggleGroup(this)">
                ${avatarHTML}
                <div class="user-info">
                    <span class="user-name">${label}</span>
                    <span class="file-count">${items.length} file${items.length > 1 ? 's' : ''}</span>
                </div>
                <span class="collapse-arrow">▽</span>
            </div>
            <div class="file-table">
                <div class="file-table-head">
                    <span class="col-name sortable" data-sort="file" onclick="event.stopPropagation(); setSort('file')">ชื่อไฟล์ ${getSortIcon('file')}</span>
                    <span class="col-sender sortable" data-sort="sender" onclick="event.stopPropagation(); setSort('sender')">ผู้ส่ง ${getSortIcon('sender')}</span>
                    <span class="col-date sortable" data-sort="uploadTime" onclick="event.stopPropagation(); setSort('uploadTime')">วันที่อัพโหลด ${getSortIcon('uploadTime')}</span>
                    <span class="col-size sortable" data-sort="size" onclick="event.stopPropagation(); setSort('size')">ขนาด ${getSortIcon('size')}</span>
                    <span class="col-actions">Actions</span>
                </div>
                ${sorted.map(item => `
                    <div class="file-row" data-user="${item.user}" data-file="${item.file}">
                        <span class="col-name file-name-cell">
                            <span class="file-icon">${getFileIcon(item.file)}</span>
                            <span class="file-label">${item.file}</span>
                        </span>
                        <span class="col-sender sender-badge">${item.sender || item.user}</span>
                        <span class="col-date date-cell">${formatDate(item.uploadTime)}</span>
                        <span class="col-size size-cell">${formatSize(item.size)}</span>
                        <span class="col-actions action-btns">

                        <button class="btn-share" onclick="openShareModal('${item.file}')" style="background: #6366f1; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                          Share
                         </button>

                            <button class="btn-download" onclick="downloadFile('${item.user}', '${item.file}')" title="Download">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                Download
                            </button>
                            <button class="btn-delete" onclick="deleteFile('${item.user}', '${item.file}')" title="Delete">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                                Delete
                            </button>
                        </span>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    // All files group (เฉพาะ admin) จะอยู่ด้านบนสุด และไม่มี collapse
    const allGroup = (role === 'admin') ? buildGroup('All Files', '★', data, true) : "";

    // แต่ละ user group
    const userGroups = Object.entries(grouped).map(([user, items]) =>
        buildGroup(user, user.charAt(0).toUpperCase(), items)
    ).join('');

    container.innerHTML = allGroup + userGroups;

    // collapse All group by default
    const allGroupEl = container.querySelector('.user-group-all');
    if (allGroupEl) {
        const table = allGroupEl.querySelector('.file-table');
        const arrow = allGroupEl.querySelector('.collapse-arrow');
        if (table) table.style.display = 'none';
        if (arrow) arrow.textContent = '▷';
    }

    // ผูก hover preview
    container.querySelectorAll(".file-row[data-user]").forEach(row => {
        const u = row.dataset.user;
        const f = row.dataset.file;
        row.addEventListener("mouseenter", () => showHoverPreview(u, f));
        row.addEventListener("mousemove", moveHoverPreview);
        row.addEventListener("mouseleave", hideHoverPreview);
    });
}

// =============================
// Upload
// =============================
async function uploadFile(event) {
    event.preventDefault();
    const fileInput = document.getElementById("fileInput");
    const sender = localStorage.getItem("username");
    const statusEl = document.getElementById("uploadStatus");

    if (!fileInput.files[0]) {
        if (statusEl) { statusEl.textContent = "⚠️ กรุณาเลือกไฟล์ก่อน"; statusEl.style.color = "#f59e0b"; }
        return;
    }

    if (statusEl) { statusEl.textContent = "⏳ กำลังอัปโหลด..."; statusEl.style.color = "#6366f1"; }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("sender", sender);
    formData.append("recipient", sender); // อัปโหลดเข้าโฟลเดอร์ตัวเองเสมอ

    try {
        const res = await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
        if (res.ok) {
            if (statusEl) { statusEl.textContent = "✅ อัปโหลดเรียบร้อย!"; statusEl.style.color = "#10b981"; }
            clearFileInput();
            loadFiles();
            setTimeout(() => { if (statusEl) statusEl.textContent = ""; }, 3000);
        } else {
            if (statusEl) { statusEl.textContent = "❌ เกิดข้อผิดพลาด กรุณาลองใหม่"; statusEl.style.color = "#ef4444"; }
        }
    } catch (error) {
        console.error("Upload error:", error);
        if (statusEl) { statusEl.textContent = "❌ ไม่สามารถเชื่อมต่อ server ได้"; statusEl.style.color = "#ef4444"; }
    }
}

// --- 2. ฟังก์ชันใหม่สำหรับ "ส่งไฟล์ที่มีอยู่แล้ว" ให้คนอื่น ---
async function sendToUser(fileName, targetUser) {
    const sender = localStorage.getItem("username");
    try {
        const response = await fetch(`${API_URL}/share-file`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileName, sender, recipient: targetUser })
        });
        if (response.ok) alert(`Sent ${fileName} to ${targetUser}`);
    } catch (error) { console.error(error); }
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

async function openShareModal(fileName) {
    const me = localStorage.getItem("username");

    // ดึง user list ล่าสุดจาก server
    let users = [];
    try {
        const res = await fetch(`${API_URL}/users`);
        users = (await res.json()).filter(u => u.username !== me);
    } catch (e) {}

    // ลบ modal เก่าถ้ามี
    const old = document.getElementById("shareModalOverlay");
    if (old) old.remove();

    const overlay = document.createElement("div");
    overlay.id = "shareModalOverlay";
    overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.45);
        display: flex; align-items: center; justify-content: center;
        z-index: 99999;
    `;
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

    const modal = document.createElement("div");
    modal.style.cssText = `
        background: white; border-radius: 16px; padding: 28px;
        width: 360px; max-width: 92vw;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    `;

    const userOptions = users.length > 0
        ? users.map(u => `
            <label style="display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; cursor:pointer; transition:background 0.15s;"
                onmouseover="this.style.background='#f5f3ff'" onmouseout="this.style.background='transparent'">
                <input type="checkbox" value="${u.username}" style="width:16px; height:16px; accent-color:#6366f1;">
                <span style="font-size:28px; line-height:1;">${u.username.charAt(0).toUpperCase()}</span>
                <span style="font-weight:500;">${u.username}</span>
            </label>`).join('')
        : `<p style="color:#888; text-align:center; padding: 12px 0;">ไม่มีผู้ใช้งานอื่นในระบบ</p>`;

    modal.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
            <h3 style="margin:0; font-size:17px;">📤 ส่งไฟล์ให้เพื่อน</h3>
            <button onclick="document.getElementById('shareModalOverlay').remove()"
                style="background:none; border:none; font-size:20px; cursor:pointer; color:#888; line-height:1;">✕</button>
        </div>
        <div style="background:#f9fafb; border-radius:8px; padding:8px 12px; margin-bottom:16px; font-size:13px; color:#374151;">
            📄 <strong>${fileName}</strong>
        </div>
        <div style="font-size:13px; font-weight:600; color:#374151; margin-bottom:8px;">เลือกผู้รับ:</div>
        <div id="shareUserList" style="max-height:200px; overflow-y:auto; border:1.5px solid #e5e7eb; border-radius:10px; padding:4px;">
            ${userOptions}
        </div>
        <button id="shareConfirmBtn" onclick="confirmShare('${fileName}')" style="
            margin-top:18px; width:100%; padding:11px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color:white; border:none; border-radius:10px;
            font-size:15px; font-weight:600; cursor:pointer;
        ">✉️ ส่งเลย</button>
        <div id="shareStatus" style="margin-top:8px; text-align:center; font-size:13px; min-height:18px;"></div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

async function confirmShare(fileName) {
    const checked = [...document.querySelectorAll("#shareUserList input[type='checkbox']:checked")];
    const recipients = checked.map(c => c.value);
    const statusEl = document.getElementById("shareStatus");

    if (recipients.length === 0) {
        if (statusEl) { statusEl.textContent = "⚠️ กรุณาเลือกผู้รับก่อนกดส่ง"; statusEl.style.color = "#f59e0b"; }
        return;
    }

    const sender = localStorage.getItem("username");
    const btn = document.getElementById("shareConfirmBtn");
    if (btn) btn.disabled = true;
    if (statusEl) { statusEl.textContent = "⏳ กำลังส่ง..."; statusEl.style.color = "#6366f1"; }

    let success = 0;
    for (const recipient of recipients) {
        try {
            const res = await fetch(`${API_URL}/share-file`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileName, sender, recipient })
            });
            if (res.ok) success++;
        } catch (e) { console.error(e); }
    }

    if (statusEl) { statusEl.textContent = `✅ ส่งไฟล์ให้ ${success} คน เรียบร้อย!`; statusEl.style.color = "#10b981"; }
    loadFiles();
    setTimeout(() => { document.getElementById("shareModalOverlay")?.remove(); }, 1500);
}