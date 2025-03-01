// Theme Toggle
const toggleButton = document.getElementById('theme-toggle');
const body = document.body;
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

// Chat Elements
const chatButton = document.getElementById('chat-button');
const miniChat = document.getElementById('mini-chat');
const chatClose = document.getElementById('chat-close');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');

// Language Support based on system preference
let currentLang = 'en';

function detectSystemLanguage() {
  const userLang = navigator.language || navigator.languages[0];
  currentLang = userLang.startsWith('es') ? 'es' : 'en';
}

function updateLanguage() {
  const elements = document.querySelectorAll('[data-lang-en]');
  elements.forEach(el => {
    el.textContent = el.getAttribute(`data-lang-${currentLang}`);
  });
}

// Check OS theme on load
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  body.classList.add('dark');
}

// Toggle theme on button click
toggleButton.addEventListener('click', () => {
  body.classList.toggle('dark');
});

// Toggle mobile menu
menuToggle.addEventListener('click', () => {
  navLinks.classList.toggle('active');
  menuToggle.textContent = navLinks.classList.contains('active') ? '✖' : '☰';
});

// Update active navigation link on click
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelector('.nav-links a.active').classList.remove('active');
    link.classList.add('active');
    navLinks.classList.remove('active');
    menuToggle.textContent = '☰';
  });
});

// Intersection Observer para detectar sección visible
const sections = document.querySelectorAll('section');
const navItems = document.querySelectorAll('.nav-links a');

const observerOptions = {
  root: null,
  rootMargin: '-50% 0px -50% 0px',
  threshold: 0
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${id}`) {
          item.classList.add('active');
        }
      });
    }
  });
}, observerOptions);

sections.forEach(section => {
  observer.observe(section);
});

// Fetch server status from MCSRVSTAT API
async function updateServerStatus() {
  const servers = [
    { id: 'server-nova-terra', ip: 'mc.novaterra.g2806.net' },
    { id: 'server-rompe-discotecas', ip: 'mc.novaterra.g2806.net' }
  ];

  for (const server of servers) {
    try {
      const response = await fetch(`https://api.mcsrvstat.us/2/${server.ip}`);
      const data = await response.json();
      const statusEl = document.querySelector(`#${server.id} .status`);
      const playerEl = document.querySelector(`#${server.id} .player-count`);

      if (data.online) {
        statusEl.textContent = currentLang === 'en' ? 'Online' : 'En línea';
        statusEl.classList.remove('offline');
        statusEl.classList.add('online');
        playerEl.textContent = `${data.players.online}/${data.players.max}`;
      } else {
        statusEl.textContent = currentLang === 'en' ? 'Offline' : 'Desconectado';
        statusEl.classList.remove('online');
        statusEl.classList.add('offline');
        playerEl.textContent = '0/0';
      }
    } catch (error) {
      console.error(`Error fetching status for ${server.ip}:`, error);
      const statusEl = document.querySelector(`#${server.id} .status`);
      const playerEl = document.querySelector(`#${server.id} .player-count`);
      statusEl.textContent = currentLang === 'en' ? 'Error' : 'Error';
      statusEl.classList.remove('online', 'offline');
      playerEl.textContent = 'N/A';
    }
  }
}

// Chat Functionality with Ollama API
let conversationHistory = [
  { role: 'system', content: 'You are Gabot, a helpful AI assistant created by G2806.' }
];

function addMessage(content, isUser) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message');
  messageDiv.classList.add(isUser ? 'user' : 'bot');
  const bubble = document.createElement('div');
  bubble.classList.add('bubble');
  bubble.textContent = content;
  messageDiv.appendChild(bubble);
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.classList.add('message', 'bot', 'typing');
  const bubble = document.createElement('div');
  bubble.classList.add('bubble');
  bubble.textContent = 'Typing';
  typingDiv.appendChild(bubble);
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return typingDiv;
}

function removeTypingIndicator(typingDiv) {
  if (typingDiv && chatMessages.contains(typingDiv)) {
    chatMessages.removeChild(typingDiv);
  }
}

async function sendMessageToOllama(message) {
  conversationHistory.push({ role: 'user', content: message });
  addMessage(message, true);

  const typingIndicator = showTypingIndicator();

  try {
    const response = await fetch('http://192.168.1.38:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gemma:latest', // Cambia esto al modelo que tengas instalado en Ollama
        messages: conversationHistory,
        stream: false
      })
    });

    removeTypingIndicator(typingIndicator);

    const data = await response.json();
    const botMessage = data.message.content;
    conversationHistory.push({ role: 'assistant', content: botMessage });
    addMessage(botMessage, false);
  } catch (error) {
    console.error('Error communicating with Ollama:', error);
    removeTypingIndicator(typingIndicator);
    addMessage('Sorry, something went wrong!', false);
  }
}

// Chat Button and Mini Chat Logic
chatButton.addEventListener('click', () => {
  miniChat.classList.add('active');
});

chatClose.addEventListener('click', () => {
  miniChat.classList.remove('active');
});

chatSend.addEventListener('click', () => {
  const message = chatInput.value.trim();
  if (message) {
    sendMessageToOllama(message);
    chatInput.value = '';
  }
});

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const message = chatInput.value.trim();
    if (message) {
      sendMessageToOllama(message);
      chatInput.value = '';
    }
  }
});

// Inicializar idioma y estado al cargar
detectSystemLanguage();
updateLanguage();
updateServerStatus();
setInterval(updateServerStatus, 30000);