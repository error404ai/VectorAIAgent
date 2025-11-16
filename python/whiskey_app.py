#!/usr/bin/env python
# filepath: c:\Projects\WhiskeyBA\python\whiskey_app.py
"""
Main entry point for the WhiskeyBA application.
"""

# CRITICAL: Disable browser-use cloud features FIRST to prevent API calls
import os
os.environ["ANONYMIZED_TELEMETRY"] = "false"  # Disable telemetry to PostHog
os.environ["BROWSER_USE_CLOUD_SYNC"] = "false"  # Disable cloud sync to browser-use API

# CRITICAL: Enable patchright anti-detection SECOND
# This must happen before any browser-use or playwright imports
try:
    from src.utils.patchright_integration import enable_patchright
    enable_patchright()
except Exception as e:
    print(f"[WARNING] Could not enable patchright: {e}")

import sys
from src.app import main

if __name__ == "__main__":
    sys.exit(main())
