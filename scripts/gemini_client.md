---
type: script_contract
version: 1.0.0
script: gemini_client.py
domain: api
dependencies: [google-generativeai, python-dotenv]
last_updated: 2026-03-21
---

# Gemini Client — Contract

## Purpose
Portable helper to call Gemini API via the Google Antigravity Ultra subscription.

## Interface
```python
ask_gemini(prompt: str, model: str = "gemini-2.5-pro") -> str
```

## Behavior
1. Loads API key from `.env` file (auto-discovers `D:\YO\.env` or `../.env`)
2. Sends prompt to Gemini API
3. Returns response text
4. On failure: raises `GeminiClientError` with descriptive message

## Environment
- **API Key:** `GEMINI_API_KEY` in `.env`
- **Model:** defaults to `gemini-2.5-pro`, configurable
- **Dependencies:** `google-generativeai`, `python-dotenv` (in requirements.txt)

## Portability
- No hardcoded absolute paths
- Uses `dotenv` `find_dotenv()` to auto-discover `.env`
- Works from any working directory within the workspace

## Circuit Breaker
- 3 consecutive API errors → raise `GeminiClientError` (do not retry silently)
- Matches UU-M7 pattern for rate limits

## AP Guards
- AP46: all deps in requirements.txt
- AP02: never fabricate API responses

[AUTH: Majaz_OS | contract:gemini_client | 1.0.0 | 2026-03-21]
