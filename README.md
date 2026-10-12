# BALA AI — All-in-One AI Chat

A beginner-friendly website that connects to OpenAI, Anthropic Claude, and Google Gemini through their official APIs. It supports selecting one provider or comparing all three answers.

## Important facts

- This is an **AI aggregator website**, not a new AI model. The providers still run their models on their own servers.
- You need your own API keys and may need billing/credits for each provider.
- API keys are kept in the backend `.env` file; never paste them into frontend code or publish them.
- The app does not save chat history to a database. Conversations live in the current page only.
- Model names and provider API terms can change. You can adjust model IDs in `.env`.

## 1. Requirements

Install Python 3.11 or newer. Internet access is needed to install packages and call the AI APIs.

## 2. Install

Open a terminal in this project folder:

### Windows
```powershell
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

### macOS / Linux
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## 3. Add API keys

Open `.env` in a text editor and fill in the keys you obtained from the official developer platforms:

- OpenAI API key: https://platform.openai.com/api-keys
- Anthropic API key: https://console.anthropic.com/
- Gemini API key: https://aistudio.google.com/app/apikey

You can start with just one key. Leave other keys blank until you are ready. A provider without a key will show a setup error instead of returning an answer.

## 4. Run the website

```bash
uvicorn main:app --reload
```

Open this address in your browser:

http://127.0.0.1:8000

To stop the server, press `Ctrl+C` in the terminal.

## 5. How to use

1. Choose ChatGPT, Claude, or Gemini in the left sidebar.
2. Type a message and press Enter.
3. Choose **Compare all 3** to request answers from all configured providers.
4. If a provider fails, check its API key, billing, model access, and terminal error.

## 6. Security before public deployment

This is a local starter project, not a hardened public service. Before sharing it publicly, add user authentication, rate limiting, usage limits, HTTPS, monitoring, abuse protection, and a deployment secret manager. Do not commit `.env` to Git. Never expose provider keys in browser JavaScript.

## Project structure

```text
BALA_AI/
├── main.py
├── requirements.txt
├── .env.example
├── .gitignore
├── README.md
└── static/
    ├── index.html
    ├── style.css
    └── app.js
```
