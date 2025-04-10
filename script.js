const NGROK_DOMAIN = "https://moral-grackle-vertically.ngrok-free.app";  // <= CẬP NHẬT link của bạn tại đây

const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const toggleCheckbox = document.getElementById('mode-toggle-checkbox');
const logo = document.getElementById('logo');

let conversationHistory = [];

window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('conversationHistory');
  if (saved) {
    conversationHistory = JSON.parse(saved);
    conversationHistory.forEach(item => appendMessage(item.role, item.content));
  }

  logo.src = document.body.classList.contains('dark-mode') ? 'data/normal.png' : 'data/normal.png';
});

toggleCheckbox.addEventListener("change", () => {
  document.body.classList.toggle("dark-mode");
  logo.src = document.body.classList.contains("dark-mode") ? "data/normal.png" : "data/normal.png";
});

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage('user', message);
  conversationHistory.push({ role: 'user', content: message });
  localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
  userInput.value = '';

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

const API_URL = "https://moral-grackle-vertically.ngrok-free.app/chat/";  // thay bằng ngrok của bạn

async function getResponseFromLLMStudio(message) {
  chatBox.querySelectorAll('.bot').forEach(e => e.parentElement.remove());

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
    const response = await fetch(API_URL, {
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




const dropZone = document.getElementById('drop-zone');

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('active');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('active');
});

dropZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  dropZone.classList.remove('active');

  const file = e.dataTransfer.files[0];
  if (!file) return;

  appendMessage('user', `📄 Bạn đã gửi file: ${file.name}`);

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${NGROK_DOMAIN}/upload/`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    const aiMessage = data.result || "⚠️ AI không xử lý được file.";
    appendMessage('bot', aiMessage);

  } catch (err) {
    appendMessage('bot', '⚠️ Lỗi khi gửi file đến server.');
  }
});



// === Kích hoạt vùng drop khi kéo file vào bất kỳ đâu trên trang ===
window.addEventListener('dragenter', (e) => {
  if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
    dropZone.classList.add('show');
  }
});

window.addEventListener('dragleave', (e) => {
  // Chỉ ẩn nếu rời ra khỏi toàn bộ cửa sổ
  if (e.clientX === 0 && e.clientY === 0) {
    dropZone.classList.remove('show');
  }
});

window.addEventListener('drop', () => {
  dropZone.classList.remove('show');
});
