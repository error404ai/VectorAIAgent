"""
Patchright integration for anti-detection browser automation.
This module should be imported before any browser-use or playwright imports.
"""
import sys
import logging

def enable_patchright():
    """
    Enable patchright as a replacement for playwright for anti-detection.
    This must be called before any browser-use imports.
    """
    try:
        # Import patchright modules
        import patchright.async_api as patchright_async
        import patchright.sync_api as patchright_sync
        
        # Replace playwright modules in sys.modules
        sys.modules['playwright.async_api'] = patchright_async
        sys.modules['playwright.sync_api'] = patchright_sync
        sys.modules['playwright'] = patchright_async  # Default to async
        
        print("[STEALTH] Patchright anti-detection enabled successfully")
        print(f"[STEALTH] Playwright.async_api now points to: {patchright_async.__file__}")
        return True
        
    except ImportError as e:
        print(f"[WARNING] Patchright not available: {e}")
        print("[WARNING] Falling back to regular playwright (detection possible)")
        return False

def install_patchright_browsers():
    """Install browsers for patchright if needed."""
    try:
        import subprocess
        import sys
        
        # Try to install patchright browsers
        result = subprocess.run([
            sys.executable, "-m", "patchright", "install", "chromium"
        ], capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            print("[STEALTH] Patchright browsers installed successfully")
            return True
        else:
            print(f"[WARNING] Failed to install patchright browsers: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"[WARNING] Error installing patchright browsers: {e}")
        return False

# Automatically enable patchright when this module is imported
if __name__ != "__main__":
    enable_patchright()
