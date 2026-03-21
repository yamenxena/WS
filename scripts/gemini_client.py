"""
Majaz AI OS — Gemini API Client
Portable helper for calling Gemini via Antigravity Ultra subscription.
Contract: scripts/gemini_client.md

[AUTH: Majaz_OS | gemini_client | 1.0.0 | 2026-03-21]
"""

import os
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv, find_dotenv
    import google.generativeai as genai
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Run: pip install google-generativeai python-dotenv")
    sys.exit(1)


class GeminiClientError(Exception):
    """Raised when Gemini API call fails."""
    pass


def _load_api_key() -> str:
    """
    Auto-discover .env file and load GEMINI_API_KEY.
    Search order: current dir, parent dirs, D:/YO/.env
    """
    # Try dotenv auto-discovery first
    env_path = find_dotenv(usecwd=True)

    if not env_path:
        # Fallback: check common locations relative to this script
        script_dir = Path(__file__).resolve().parent
        candidates = [
            script_dir.parent / ".env",       # WS/.env
            script_dir.parent.parent / ".env", # YO/.env
        ]
        for candidate in candidates:
            if candidate.exists():
                env_path = str(candidate)
                break

    if env_path:
        load_dotenv(env_path)

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise GeminiClientError(
            "GEMINI_API_KEY not found. "
            "Set it in your .env file (see .agents/config/.env.example)"
        )
    return api_key


def ask_gemini(
    prompt: str,
    model: str = "gemini-2.5-pro",
    max_retries: int = 3,
) -> str:
    """
    Send a prompt to Gemini and return the response text.

    Args:
        prompt: The text prompt to send.
        model: Gemini model name (default: gemini-2.5-pro).
        max_retries: Max consecutive failures before raising (circuit breaker).

    Returns:
        Response text from Gemini.

    Raises:
        GeminiClientError: On API failure after max_retries.
    """
    api_key = _load_api_key()
    genai.configure(api_key=api_key)

    errors = []
    for attempt in range(max_retries):
        try:
            gen_model = genai.GenerativeModel(model)
            response = gen_model.generate_content(prompt)
            return response.text
        except Exception as e:
            errors.append(f"Attempt {attempt + 1}: {e}")

    # Circuit breaker: 3 consecutive failures
    raise GeminiClientError(
        f"Gemini API failed after {max_retries} attempts.\n"
        + "\n".join(errors)
    )


# --- CLI usage ---
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python gemini_client.py 'your prompt here'")
        sys.exit(1)

    user_prompt = " ".join(sys.argv[1:])
    try:
        result = ask_gemini(user_prompt)
        print(result)
    except GeminiClientError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
