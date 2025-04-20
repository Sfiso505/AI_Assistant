// ENTER to send
document.getElementById("userMessage").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// File attachment
document.getElementById("attachIcon").addEventListener("click", () => {
    document.getElementById("fileInput").click();
});

document.getElementById("fileInput").addEventListener("change", uploadFile);

// Append message to chat
function appendMessage(sender, text) {
    const chatContainer = document.getElementById("chatbotReply");

    const wrapper = document.createElement("div");
    wrapper.className = `message-wrapper${sender === "user" ? " user" : ""}`;

    const avatar = document.createElement("img");
    avatar.src = sender === "user" ? "icons/user2.webp" : "icons/assistant.svg";
    avatar.className = "avatar";

    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${sender}-message`;
    msgDiv.innerHTML = `${markdownToHtml(text)} <span class="message-time">${new Date().toLocaleTimeString()}</span>`;

    wrapper.appendChild(avatar);
    wrapper.appendChild(msgDiv);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight + 100;
}

// Typing indicator
function showTypingIndicator() {
    const chatContainer = document.getElementById("chatbotReply");
    const typingDiv = document.createElement("div");
    typingDiv.className = "message-wrapper";
    typingDiv.id = "typingIndicator";

    const avatar = document.createElement("img");
    avatar.src = "icons/assistant.svg";
    avatar.className = "avatar";

    const dots = document.createElement("div");
    dots.className = "message bot-message typing";
    dots.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;

    typingDiv.appendChild(avatar);
    typingDiv.appendChild(dots);
    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight + 100;
}

function removeLastBotMessage() {
    const typing = document.getElementById("typingIndicator");
    if (typing) typing.remove();
}

// Send message to backend
async function sendMessage() {
    const inputBox = document.getElementById("userMessage");
    const userText = inputBox.value.trim();
    if (!userText) return;

    appendMessage("user", userText);
    inputBox.value = "";
    showTypingIndicator();

    try {
        const res = await fetch("http://127.0.0.1:5000/ask", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: userText })
        });

        const data = await res.json();
        removeLastBotMessage();
        appendMessage("bot", data.response);
    } catch (error) {
        removeLastBotMessage();
        console.error("Fetch error:", error);
        appendMessage("bot", "⚠️ Something went wrong!");
    }
}

// File upload logic
async function uploadFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    appendMessage("user", `📎 Uploaded file: ${file.name}`);
    showTypingIndicator();

    try {
        const res = await fetch("http://127.0.0.1:5000/upload", {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        removeLastBotMessage();
        appendMessage("bot", data.response);
    } catch (error) {
        removeLastBotMessage();
        console.error("File upload error:", error);
        appendMessage("bot", "⚠️ File upload failed.");
    }
}

// 🎙 Show Listening Indicator
function showListeningIndicator() {
    const chatContainer = document.getElementById("chatbotReply");

    const wrapper = document.createElement("div");
    wrapper.className = "message-wrapper user";
    wrapper.id = "listeningIndicator";

    const avatar = document.createElement("img");
    avatar.src = "icons/user2.webp";
    avatar.className = "avatar";

    const msgDiv = document.createElement("div");
    msgDiv.className = "message user-message";
    msgDiv.innerHTML = `🎙 <em>Listening...</em>`;

    wrapper.appendChild(msgDiv);
    wrapper.appendChild(avatar);
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight + 100;
}

function removeListeningIndicator() {
    const existing = document.getElementById("listeningIndicator");
    if (existing) existing.remove();
}

// 🎤 Voice recognition
const micIcon = document.querySelector('img[alt="Record"]');
micIcon.addEventListener("click", () => {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Voice input not supported in this browser.");
        return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();
    showListeningIndicator();

    recognition.onresult = function (event) {
        removeListeningIndicator();
        const transcript = event.results[0][0].transcript;
        document.getElementById("userMessage").value = transcript;
    };

    recognition.onerror = function (event) {
        removeListeningIndicator();
        console.error("Voice recognition error:", event.error);
    };

    recognition.onend = function () {
        removeListeningIndicator();
    };
});

// Emoji Picker
const emojiIcon = document.querySelector('img[alt="Emoji"]');
const emojiPicker = document.getElementById("emojiPicker");
const inputField = document.getElementById("userMessage");

emojiIcon.addEventListener("click", () => {
    emojiPicker.style.display = emojiPicker.style.display === "none" ? "block" : "none";
});

emojiPicker.addEventListener("emoji-click", event => {
    const emoji = event.detail.unicode;
    insertAtCursor(inputField, emoji);
    emojiPicker.style.display = "none";
});

document.addEventListener("click", (event) => {
    if (!emojiPicker.contains(event.target) && event.target !== emojiIcon) {
        emojiPicker.style.display = "none";
    }
});

function insertAtCursor(input, textToInsert) {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    input.value = text.slice(0, start) + textToInsert + text.slice(end);
    input.selectionStart = input.selectionEnd = start + textToInsert.length;
    input.focus();
}

// Dark mode toggle
const toggleBtn = document.getElementById("themeToggle");
toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    document.body.classList.toggle("light");
    toggleBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

// Markdown parser
function markdownToHtml(markdown) {
    markdown = markdown.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    markdown = markdown.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre class="code-block"><code class="language-${lang || ''}">${code.trim()}</code><button class="copy-btn">📋</button></pre>`;
    });
    markdown = markdown.replace(/`([^`\n]+)`/g, "<code class='inline-code'>$1</code>");
    markdown = markdown.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    markdown = markdown.replace(/\*(.*?)\*/g, "<em>$1</em>");
    markdown = markdown.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    markdown = markdown.replace(/^## (.*$)/gim, "<h2>$1</h2>");
    markdown = markdown.replace(/^# (.*$)/gim, "<h1>$1</h1>");
    markdown = markdown.replace(/(?:^|\n)[*-] (.*?)(?=\n|$)/g, "<li>$1</li>");
    if (markdown.includes("<li>") && !markdown.includes("<ol>")) markdown = "<ul>" + markdown + "</ul>";
    markdown = markdown.replace(/(?:^|\n)(\d+)\. (.*?)(?=\n|$)/g, "<li>$2</li>");
    if (markdown.includes("<li>") && markdown.includes("<ol>")) markdown = "<ol>" + markdown + "</ol>";
    markdown = markdown.replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" class="chat-image" />');
    markdown = markdown.replace(/\n+/g, "<br>");
    return markdown;
}

// Copy button
document.addEventListener("click", function (e) {
    if (e.target.classList.contains("copy-btn")) {
        const code = e.target.previousElementSibling.textContent;
        navigator.clipboard.writeText(code).then(() => {
            e.target.textContent = "✅";
            setTimeout(() => (e.target.textContent = "📋"), 1500);
        });
    }
});

const titles = [
    "Hi there! EmBot here.",
    "Need help with a file?",
    "Ask me anything!",
    "Ready when you are 😊",
    "Let's chat."  
];

let titleIndex = 0;
const rotatingTitle = document.getElementById("rotatingTitle");

function cycleTitle() {
    rotatingTitle.style.opacity = 0;

    setTimeout(() => {
        titleIndex = (titleIndex + 1) % titles.length;
        rotatingTitle.textContent = titles[titleIndex];
        rotatingTitle.style.opacity = 1;
    }, 500);
}

setInterval(cycleTitle, 3500); // Rotate every 3.5 seconds
