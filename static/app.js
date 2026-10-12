const API_URL = "/api/chat";

const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message");
const providerSelect = document.getElementById("provider");
const chatBox = document.getElementById("chat-box");

function addMessage(sender, text) {
  const message = document.createElement("div");
  message.style.padding = "12px";
  message.style.margin = "10px 0";
  message.style.borderRadius = "8px";
  message.style.background =
    sender === "You" ? "#1e3a8a" : "#1e293b";

  const title = document.createElement("strong");
  title.textContent = sender;

  const content = document.createElement("p");
  content.textContent = text;

  message.append(title, content);
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = messageInput.value.trim();
  if (!message) return;

  addMessage("You", message);
  messageInput.value = "";

  const button = chatForm.querySelector("button");
  button.disabled = true;

  try {
    addMessage("BALA AI", "Thinking...");

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message,
        provider: providerSelect.value
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Request failed");
    }

    chatBox.lastElementChild.remove();
    addMessage("BALA AI", data.response);
  } catch (error) {
    chatBox.lastElementChild.remove();
    addMessage("Error", error.message);
  } finally {
    button.disabled = false;
  }
});
