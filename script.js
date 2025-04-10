const NGROK_DOMAIN = "https://moral-grackle-vertically.ngrok-free.app";  // <= CẬP NHẬT link của bạn tại đây
const API_CHAT = `${NGROK_DOMAIN}/chat/`;
const API_UPLOAD_MULTI = `${NGROK_DOMAIN}/upload-multi/`;

const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const toggleCheckbox = document.getElementById('mode-toggle-checkbox');
const dropZone = document.getElementById('drop-zone');
const logo = document.getElementById('logo');

let conversationHistory = [];
let uploadedFiles = [];  // lưu file tạm thời

// === Giao diện khởi tạo ===
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('conversationHistory');
  if (saved) {
    conversationHistory = JSON.parse(saved);
    chatBox.innerHTML = ''; // clear trước khi load
    conversationHistory.forEach(item => {
      appendMessage(item.role, item.content);
    });
  }
});

// === Giao diện dark/light mode ===
toggleCheckbox.addEventListener("change", () => {
  document.body.classList.toggle("dark-mode");
  logo.src = document.body.classList.contains("dark-mode") ? "data/normal.png" : "data/normal.png";
});

// === Gửi tin nhắn ===
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage('user', message);
  userInput.value = '';

  // === Nếu người dùng vừa kéo file và có yêu cầu ===
  if (uploadedFiles.length > 0) {
    const formData = new FormData();
    formData.append('prompt', message);
    uploadedFiles.forEach(file => formData.append('files', file));

    try {
      const response = await fetch(API_UPLOAD_MULTI, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      const reply = data.result || "⚠️ AI không phản hồi.";
      appendMessage('bot', reply);
    } catch (err) {
      appendMessage('bot', '⚠️ Lỗi khi gửi file đến server.');
    }

    uploadedFiles = []; // reset lại
    return;
  }

  // === Nếu không có file, gửi tin nhắn bình thường ===
  getResponseFromLLMStudio(message);
}

function appendMessage(role, text) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('message-wrapper');

  if (role === 'bot') {
    const logoImg = document.createElement('img');
    logoImg.src = 'data/bot.png';
    logoImg.alt = 'Bot Logo';
    logoImg.classList.add('bot-logo');
    wrapper.appendChild(logoImg);
  }

  const msg = document.createElement('div');
  msg.classList.add('message', role);
  msg.innerHTML = formatText(text);
  wrapper.appendChild(msg);
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function formatText(text) {
  const lines = text.trim().split('\n');
  const numberedLines = lines.filter(line => /^\d+\.\s+/.test(line));
  if (numberedLines.length >= 2) {
    const listItems = lines.map(line => {
      const match = line.match(/^\d+\.\s+(.*)/);
      return match ? `<li>${match[1].trim()}</li>` : `<br>${line}`;
    });
    return `<ol>${listItems.join('')}</ol>`;
  }
  return text
    .replace(/([.!?])\s*/g, '$1<br><br>')
    .replace(/\n/g, '<br>');
}

// === Gọi API /chat/ khi không có file ===
async function getResponseFromLLMStudio(message) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('message-wrapper');

  const logoImg = document.createElement('img');
  logoImg.src = 'data/bot.png';
  logoImg.alt = 'Bot Logo';
  logoImg.classList.add('bot-logo');
  wrapper.appendChild(logoImg);

  const msg = document.createElement('div');
  msg.classList.add('message', 'bot');
  msg.innerHTML = '';
  wrapper.appendChild(msg);
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const response = await fetch(API_CHAT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: message })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "⚠️ Không có phản hồi từ AI.";

    msg.innerHTML = formatText(content);
    conversationHistory.push({ role: "assistant", content: content.trim() });
    localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));

  } catch (error) {
    msg.innerHTML = '⚠️ Lỗi kết nối tới máy chủ.';
  }
}

// === Xử lý kéo thả file ===
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('active');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('active');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('active', 'show');

  const files = Array.from(e.dataTransfer.files);
  if (files.length === 0) return;

  uploadedFiles = files;
  appendMessage('user', `📁 Đã thêm ${files.length} file. Vui lòng nhập yêu cầu xử lý và gửi.`);
});

// === Hiện drop zone khi kéo file vào ===
window.addEventListener('dragenter', (e) => {
  if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
    dropZone.classList.add('show');
  }
});

window.addEventListener('dragleave', (e) => {
  if (e.clientX === 0 && e.clientY === 0) {
    dropZone.classList.remove('show');
  }
});

window.addEventListener('drop', () => {
  dropZone.classList.remove('show');
});
