// lms-features.js
// Adds three features: attendance scanning (index), assignment submission (course-detail), chat per course (courses)

(function () {
    document.addEventListener('DOMContentLoaded', () => {
        initChatButtons();
        initAssignmentForm();
        initAbsenButton();
    });

    // -------------------- Chat --------------------
    function initChatButtons() {
        document.querySelectorAll('.btn-chat').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const course = btn.getAttribute('data-course') || 'Kursus';
                openChatModal(course);
            });
        });
    }

    function openChatModal(courseName) {
        const modalId = 'chat-modal-' + slug(courseName);
        let modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            return;
        }

        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'lms-modal';
        modal.style = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:9999;';
        modal.innerHTML = `
            <div style="width:420px;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,0.12)">
                <div style="padding:12px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
                    <strong>Chat — ${escapeHtml(courseName)}</strong>
                    <button class="close-chat" style="background:none;border:none;font-size:18px;cursor:pointer">✕</button>
                </div>
                <div class="chat-body" style="height:320px;overflow:auto;padding:12px;background:#fbfbfb;">
                    <ul class="chat-messages" style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;"></ul>
                </div>
                <div style="padding:10px;border-top:1px solid #eee;display:flex;gap:8px;align-items:center;">
                    <select id="chat-role-${modalId}" style="padding:6px;border-radius:6px;border:1px solid #ddd;">
                        <option value="Murid">Murid</option>
                        <option value="Guru">Guru</option>
                    </select>
                    <input id="chat-input-${modalId}" placeholder="Tulis pesan..." style="flex:1;padding:8px;border-radius:6px;border:1px solid #ddd;" />
                    <button id="chat-send-${modalId}" class="btn btn-primary" style="padding:8px 12px;">Kirim</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const messagesEl = modal.querySelector('.chat-messages');
        const roleEl = modal.querySelector('#chat-role-' + modalId);
        const inputEl = modal.querySelector('#chat-input-' + modalId);
        const sendBtn = modal.querySelector('#chat-send-' + modalId);
        const closeBtn = modal.querySelector('.close-chat');

        closeBtn.addEventListener('click', () => modal.remove());

        const storageKey = 'chat_' + slug(courseName);

        function loadMessages() {
            messagesEl.innerHTML = '';
            const data = JSON.parse(localStorage.getItem(storageKey) || '[]');
            data.forEach(m => {
                const li = document.createElement('li');
                li.style.padding = '8px';
                li.style.borderRadius = '8px';
                li.style.maxWidth = '80%';
                if (m.role === 'Guru') {
                    li.style.background = '#eef2ff';
                    li.style.alignSelf = 'flex-start';
                } else {
                    li.style.background = '#e6f7ef';
                    li.style.alignSelf = 'flex-end';
                }
                li.innerHTML = `<div style="font-size:12px;color:#555;margin-bottom:4px;"><strong>${escapeHtml(m.role)}</strong> • ${new Date(m.time).toLocaleString()}</div><div>${escapeHtml(m.text)}</div>`;
                messagesEl.appendChild(li);
            });
            messagesEl.parentElement.scrollTop = messagesEl.parentElement.scrollHeight;
        }

        sendBtn.addEventListener('click', () => {
            const text = inputEl.value.trim();
            if (!text) return;
            const msg = { role: roleEl.value, text, time: Date.now() };
            const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
            existing.push(msg);
            localStorage.setItem(storageKey, JSON.stringify(existing));
            inputEl.value = '';
            loadMessages();
        });

        loadMessages();
    }

    // -------------------- Assignment submission --------------------
    function initAssignmentForm() {
        const form = document.getElementById('assignment-form');
        if (!form) return;

        const courseTitleEl = document.querySelector('.course-card .course-header h2');
        const courseName = courseTitleEl ? courseTitleEl.textContent.trim() : 'Course';
        const listEl = document.getElementById('assignment-list');
        const storageKey = 'assignments_' + slug(courseName);

        function renderList() {
            listEl.innerHTML = '';
            const data = JSON.parse(localStorage.getItem(storageKey) || '[]');
            data.slice().reverse().forEach(item => {
                const li = document.createElement('li');
                li.style.padding = '8px 0';
                li.innerHTML = `<strong>${escapeHtml(item.title)}</strong> — ${escapeHtml(item.fileName)} <br><small>${new Date(item.time).toLocaleString()}</small>`;
                if (item.dataUrl) {
                    const a = document.createElement('a');
                    a.href = item.dataUrl;
                    a.download = item.fileName || 'file';
                    a.style.display = 'inline-block';
                    a.style.marginLeft = '8px';
                    a.textContent = 'Download';
                    li.appendChild(a);
                }
                listEl.appendChild(li);
            });
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('assignment-title').value.trim();
            const fileInput = document.getElementById('assignment-file');
            const file = fileInput.files[0];
            if (!title || !file) return alert('Isikan nama tugas dan pilih file.');

            const reader = new FileReader();
            reader.onload = function (ev) {
                const dataUrl = ev.target.result;
                const item = { title, fileName: file.name, time: Date.now() };
                // store dataUrl if not too large
                try {
                    if (dataUrl.length < 1024 * 1024) { // <1MB
                        item.dataUrl = dataUrl;
                    }
                } catch (err) { }
                const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
                existing.push(item);
                localStorage.setItem(storageKey, JSON.stringify(existing));
                form.reset();
                renderList();
                alert('Tugas berhasil dikumpulkan (simulasi).');
            };
            reader.readAsDataURL(file);
        });

        renderList();
    }

    // -------------------- Absen (QR scan) --------------------
    function initAbsenButton() {
        const btn = document.getElementById('btn-absen-scan');
        if (!btn) return;

        btn.addEventListener('click', () => {
            openAbsenModal();
        });
    }

    function openAbsenModal() {
        const modalId = 'absen-modal';
        if (document.getElementById(modalId)) return;

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.style = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:9999;';
        modal.innerHTML = `
            <div style="width:520px;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,0.12)">
                <div style="padding:12px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
                    <strong>Absen — Scan Kartu Tanda Mahasiswa</strong>
                    <button id="absen-close" style="background:none;border:none;font-size:18px;cursor:pointer">✕</button>
                </div>
                <div style="display:flex;gap:12px;padding:12px;">
                    <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
                        <video id="absen-video" autoplay playsinline style="width:100%;height:260px;background:#000;border-radius:6px"></video>
                        <div style="display:flex;gap:8px;">
                            <button id="absen-start" class="btn btn-primary">Mulai Scan</button>
                            <button id="absen-stop" class="btn btn-secondary">Stop</button>
                            <input id="absen-manual" placeholder="Masukkan NIM manual" style="flex:1;padding:8px;border-radius:6px;border:1px solid #ddd;" />
                            <button id="absen-manual-send" class="btn btn-primary">Absen</button>
                        </div>
                        <div id="absen-result" style="font-size:14px;color:#111"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const video = document.getElementById('absen-video');
        const startBtn = document.getElementById('absen-start');
        const stopBtn = document.getElementById('absen-stop');
        const closeBtn = document.getElementById('absen-close');
        const manualInput = document.getElementById('absen-manual');
        const manualSend = document.getElementById('absen-manual-send');
        const resultEl = document.getElementById('absen-result');

        let stream = null;
        let scanning = false;
        let rafId = null;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        closeBtn.addEventListener('click', () => {
            stopStream();
            modal.remove();
        });

        startBtn.addEventListener('click', async () => {
            if (scanning) return;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                video.srcObject = stream;
                scanning = true;
                resultEl.textContent = 'Menyala: Arahkan QR/NFC visual kartu ke kamera.';
                tick();
            } catch (err) {
                resultEl.textContent = 'Gagal mengakses kamera: ' + err.message;
            }
        });

        stopBtn.addEventListener('click', () => {
            stopStream();
            resultEl.textContent = 'Pindai dihentikan.';
        });

        manualSend.addEventListener('click', () => {
            const nim = manualInput.value.trim();
            if (!nim) return alert('Masukkan NIM terlebih dahulu.');
            saveAttendance(nim, 'manual');
            resultEl.textContent = `Absen berhasil untuk NIM ${nim}`;
            manualInput.value = '';
        });

        function tick() {
            if (!scanning) return;
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                try {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    if (window.jsQR) {
                        const code = jsQR(imageData.data, imageData.width, imageData.height);
                        if (code) {
                            saveAttendance(code.data, 'qr');
                            resultEl.textContent = `Absen berhasil (QR): ${code.data}`;
                            stopStream();
                            return;
                        }
                    }
                } catch (e) {
                    // ignore
                }
            }
            rafId = requestAnimationFrame(tick);
        }

        function stopStream() {
            scanning = false;
            if (rafId) cancelAnimationFrame(rafId);
            if (stream) {
                stream.getTracks().forEach(t => t.stop());
                stream = null;
            }
            video.srcObject = null;
        }
    }

    function saveAttendance(identifier, method) {
        const key = 'attendances';
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        arr.push({ id: identifier, method, time: Date.now() });
        localStorage.setItem(key, JSON.stringify(arr));
    }

    // -------------------- Helpers --------------------
    function slug(text) {
        return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, function (s) {
            return ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[s];
        });
    }

})();
