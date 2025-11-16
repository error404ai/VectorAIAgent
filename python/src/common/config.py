#!/usr/bin/env python
# filepath: c:\Projects\WhiskeyBA\python\src\common\config.py
"""
Common configuration settings for all WhiskeyBA Python scripts.
"""
import os
import sys
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    handlers=[logging.StreamHandler(sys.stdout)],
    format='%(levelname)s: %(message)s'
)

# Initialize UTF-8 output for Windows
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding='utf-8')  # type: ignore

# Set up environment usage - do NOT hardcode secrets in source.
# When running locally, set OPENAI_API_KEY in your environment or use a
# .env file (add .env to .gitignore).
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# Set up paths
def initialize_paths():
    """Initialize and set up the necessary paths."""
    driver_path = os.path.abspath("playwright/driver")
    os.environ["PLAYWRIGHT_DRIVER_PATH"] = driver_path
    return {
        "driver_path": driver_path
    }
