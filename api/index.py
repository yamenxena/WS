"""
Vercel serverless entry point for Majaz CRM API.
Vercel expects a WSGI app in api/index.py
"""
import sys
import os

# Add the project root to path so we can import our proxy
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from scripts.notion_web_proxy import app

# Vercel expects 'app' to be the WSGI handler
