import os
import asyncio
from typing import Literal
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

load_dotenv()

app = FastAPI(title="BALA AI", version="1.0.0")

Provider = Literal["openai", "claude", "gemini"]

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=12000)
    provider: Provider = "openai"

class CompareRequest(BaseModel):
    message: str = Field(min_length=1, max_length=12000)

def missing_key(provider: str):
    key_name = {
        "openai": "OPENAI_API_KEY",
        "claude": "ANTHROPIC_API_KEY",
        "gemini": "GEMINI_API_KEY",
    }[provider]
    if not os.getenv(key_name):
        raise HTTPException(
            status_code=503,
            detail=f"{key_name} is missing. Add it to your .env file and restart BALA AI."
        )

async def ask_openai(message: str) -> str:
    missing_key("openai")
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = await client.responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
            input=message,
        )
        return response.output_text or "The model returned an empty response."
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"OpenAI error: {str(exc)[:300]}")

async def ask_claude(message: str) -> str:
    missing_key("claude")
    try:
        from anthropic import AsyncAnthropic
        client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        response = await client.messages.create(
            model=os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514"),
            max_tokens=1800,
            messages=[{"role": "user", "content": message}],
        )
        parts = [
            block.text for block in response.content
            if getattr(block, "type", None) == "text"
        ]
        return "\n".join(parts) or "The model returned an empty response."
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Claude error: {str(exc)[:300]}")

async def ask_gemini(message: str) -> str:
    missing_key("gemini")
    try:
        from google import genai
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            contents=message,
        )
        return response.text or "The model returned an empty response."
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gemini error: {str(exc)[:300]}")

PROVIDERS = {
    "openai": ask_openai,
    "claude": ask_claude,
    "gemini": ask_gemini,
}

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "configured": {
            "openai": bool(os.getenv("OPENAI_API_KEY")),
            "claude": bool(os.getenv("ANTHROPIC_API_KEY")),
            "gemini": bool(os.getenv("GEMINI_API_KEY")),
        },
    }

@app.post("/api/chat")
async def chat(req: ChatRequest):
    answer = await PROVIDERS[req.provider](req.message)
    return {"provider": req.provider, "answer": answer}

@app.post("/api/compare")
async def compare(req: CompareRequest):
    async def safe_call(name, fn):
        try:
            return {"provider": name, "answer": await fn(req.message), "ok": True}
        except Exception as exc:
            detail = getattr(exc, "detail", str(exc))
            return {"provider": name, "answer": str(detail), "ok": False}

    results = await asyncio.gather(
        safe_call("openai", ask_openai),
        safe_call("claude", ask_claude),
        safe_call("gemini", ask_gemini),
    )
    return {"results": results}

@app.get("/")
async def home():
    return FileResponse("static/index.html")

app.mount("/static", StaticFiles(directory="static"), name="static")
