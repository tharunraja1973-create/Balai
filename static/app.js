document.addEventListener("DOMContentLoaded", () => {
    const chatBox = document.getElementById("chatBox");
    const userInput = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");

    console.log("BALA AI loaded successfully!");

    if (sendBtn) {
        sendBtn.addEventListener("click", sendMessage);
    }

    if (userInput) {
        userInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                sendMessage();
            }
        });
    }

    async function sendMessage() {
        const message = userInput?.value.trim();

        if (!message) {
            alert("Please type a message!");
            return;
        }

        if (chatBox) {
            chatBox.innerHTML +=
                `<p><strong>You:</strong> ${escapeHTML(message)}</p>`;
        }

        userInput.value = "";

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: message
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Request failed");
            }

            if (chatBox) {
                chatBox.innerHTML +=
                    `<p><strong>BALA AI:</strong> ${
                        escapeHTML(data.answer || data.response || data.reply || data.message)
                    }</p>`;
            }
        } catch (error) {
            if (chatBox) {
                chatBox.innerHTML +=
                    `<p><strong>Error:</strong> ${escapeHTML(error.message)}</p>`;
            }
        }

        if (chatBox) {
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }

    function escapeHTML(text) {
        const element = document.createElement("div");
        element.textContent = String(text);
        return element.innerHTML;
    }
});
