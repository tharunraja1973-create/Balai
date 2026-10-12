"use strict";

// ========================================
// BALA AI — Main JavaScript
// Compatible with the provided main.py
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  const messagesElement = document.getElementById("messages");
  const promptInput = document.getElementById("prompt");
  const chatForm = document.getElementById("chatForm");
  const sendButton = document.getElementById("sendBtn");
  const welcomeSection = document.getElementById("welcome");
  const modeLabel = document.getElementById("modeLabel");
  const statusText = document.getElementById("statusText");
  const compareButton = document.getElementById("compareToggle");
  const newChatButton = document.getElementById("newChat");

  const providerNames = {
    openai: "ChatGPT",
    claude: "Claude",
    gemini: "Gemini"
  };

  let selectedProvider = "openai";
  let compareMode = false;
  let conversationHistory = [];

  // ----------------------------------------
  // Display messages safely
  // ----------------------------------------

  function addMessage(role, text) {
    const article = document.createElement("article");
    article.className = `message ${role}`;

    const label = document.createElement("div");
    label.className = "message-role";
    label.textContent = role === "user" ? "You" : "BALA AI";

    const content = document.createElement("div");
    content.className = "message-content";
    content.textContent = String(text);

    article.appendChild(label);
    article.appendChild(content);
    messagesElement.appendChild(article);

    messagesElement.scrollTop = messagesElement.scrollHeight;

    return article;
  }

  // ----------------------------------------
  // Select an AI provider
  // ----------------------------------------

  function selectProvider(provider) {
    if (!providerNames[provider]) return;

    selectedProvider = provider;
    compareMode = false;

    document.querySelectorAll(".model-choice").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.provider === provider
      );
    });

    compareButton.classList.remove("active");
    modeLabel.textContent = `Using ${providerNames[provider]}`;
  }

  document.querySelectorAll(".model-choice").forEach(button => {
    button.addEventListener("click", () => {
      selectProvider(button.dataset.provider);
    });
  });

  // ----------------------------------------
  // Compare all three AI models
  // ----------------------------------------

  compareButton.addEventListener("click", () => {
    compareMode = !compareMode;

    compareButton.classList.toggle("active", compareMode);

    document.querySelectorAll(".model-choice").forEach(button => {
      button.classList.toggle(
        "active",
        !compareMode &&
        button.dataset.provider === selectedProvider
      );
    });

    modeLabel.textContent = compareMode
      ? "Comparing all 3 AIs"
      : `Using ${providerNames[selectedProvider]}`;
  });

  // ----------------------------------------
  // Start a new chat
  // ----------------------------------------

  newChatButton.addEventListener("click", () => {
    messagesElement.replaceChildren();
    conversationHistory = [];

    welcomeSection.hidden = false;
    promptInput.value = "";
    promptInput.style.height = "auto";

    promptInput.focus();
  });

  // ----------------------------------------
  // Suggestion buttons
  // ----------------------------------------

  document.querySelectorAll("[data-prompt]").forEach(button => {
    button.addEventListener("click", () => {
      promptInput.value = button.dataset.prompt;

      promptInput.focus();
      promptInput.style.height = "auto";
      promptInput.style.height =
        `${Math.min(promptInput.scrollHeight, 200)}px`;
    });
  });

  // ----------------------------------------
  // Automatically resize the input
  // ----------------------------------------

  promptInput.addEventListener("input", () => {
    promptInput.style.height = "auto";
    promptInput.style.height =
      `${Math.min(promptInput.scrollHeight, 200)}px`;
  });

  // ----------------------------------------
  // Send message to backend
  // ----------------------------------------

  chatForm.addEventListener("submit", async event => {
    event.preventDefault();

    const message = promptInput.value.trim();

    if (!message || sendButton.disabled) return;

    welcomeSection.hidden = true;

    addMessage("user", message);

    promptInput.value = "";
    promptInput.style.height = "auto";

    sendButton.disabled = true;

    const loadingMessage = addMessage(
      "assistant",
      compareMode
        ? "Asking all three AIs..."
        : `Asking ${providerNames[selectedProvider]}...`
    );

    try {
      const endpoint = compareMode
        ? "/api/compare"
        : "/api/chat";

      // The supplied backend currently accepts
      // message and provider for chat.
      const payload = compareMode
        ? { message: message }
        : {
            message: message,
            provider: selectedProvider
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok) {
        const detail =
          typeof data.detail === "string"
            ? data.detail
            : "Request failed. Check your server configuration.";

        throw new Error(detail);
      }

      loadingMessage.remove();

      if (compareMode) {
        displayCompareResults(data);
      } else {
        const answer = data.answer;

        if (!answer) {
          throw new Error(
            "No answer received. Please check main.py."
          );
        }

        addMessage(
          "assistant",
          `${providerNames[selectedProvider]}\n\n${answer}`
        );

        conversationHistory.push(
          { role: "user", content: message },
          { role: "assistant", content: answer }
        );

        // Keep the latest messages in memory.
        conversationHistory = conversationHistory.slice(-20);
      }
    } catch (error) {
      loadingMessage.remove();

      addMessage(
        "assistant",
        `Sorry, something went wrong.\n\n${error.message}`
      );
    } finally {
      sendButton.disabled = false;
      promptInput.focus();
    }
  });

  // ----------------------------------------
  // Display results from /api/compare
  // The supplied main.py returns a list:
  // { results: [{provider, answer, ok}, ...] }
  // ----------------------------------------

  function displayCompareResults(data) {
    const results = Array.isArray(data.results)
      ? data.results
      : [];

    const providerOrder = ["openai", "claude", "gemini"];

    providerOrder.forEach(provider => {
      const result = results.find(
        item => item.provider === provider
      );

      let answer;

      if (!result) {
        answer = "No response received from this AI.";
      } else if (result.ok === false) {
        answer = `Error: ${result.answer}`;
      } else {
        answer = result.answer || "The AI returned an empty response.";
      }

      addMessage(
        "assistant",
        `${providerNames[provider]}\n\n${answer}`
      );
    });
  }

  // ----------------------------------------
  // Check server status
  // ----------------------------------------

  async function checkServerStatus() {
    try {
      const response = await fetch("/api/health");

      if (!response.ok) {
        throw new Error("Server unavailable");
      }

      const data = await response.json();

      const configured = data.configured || {};

      const availableCount = [
        configured.openai,
        configured.claude,
        configured.gemini
      ].filter(Boolean).length;

      if (availableCount === 3) {
        statusText.textContent = "All 3 AI keys configured";
      } else if (availableCount > 0) {
        statusText.textContent =
          `${availableCount}/3 AI keys configured`;
      } else {
        statusText.textContent = "API keys not configured";
      }
    } catch {
      statusText.textContent = "Server connection issue";
    }
  }

  // Start the application.
  selectProvider("openai");
  checkServerStatus();

  console.log("BALA AI JavaScript loaded successfully.");
});
