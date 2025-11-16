#!/usr/bin/env python
# filepath: c:\Projects\WhiskeyBA\python\src\browser\opener.py
"""
Browser opener module for opening browser instances.
"""
import asyncio
import argparse
import sys
from patchright.async_api import async_playwright

from ..common.config import initialize_paths
from ..utils.chromium_manager import get_chromium_executable_path

async def open_browser(url: str = "https://www.google.com", headless: bool = False, browser_path: str = "", profile_name: str = "default_profile") -> int:
    """
    Open a browser window using Playwright with a specific profile.
    
    Args:
        url: The URL to open in the browser
        headless: Whether to run in headless mode
        browser_path: Path to a specific browser executable (for system browser usage)
        profile_name: Name of the browser profile to use
    
    Returns:
        Exit code (0 for success, non-zero for failure)
    """
    try:
        print(f"[BROWSER] Opening browser at URL: {url}")
        print(f"[PROFILE] Using profile: {profile_name}")
          # Initialize paths
        initialize_paths()
        
        # Import profile utilities
        from ..utils.user_profile import get_browser_folder_name, get_profile_path
        
        # Determine which browser executable to use
        final_browser_path = None
        
        if browser_path:
            # User provided a specific browser path
            final_browser_path = browser_path
            print(f"[CONFIG] Using user-specified browser: {browser_path}")
        else:
            # Check if we have WhiskeyBA's installed Chromium
            whiskey_chromium_path = get_chromium_executable_path()
            if whiskey_chromium_path:
                final_browser_path = whiskey_chromium_path
                print(f"[CONFIG] Using WhiskeyBA's installed Chromium: {whiskey_chromium_path}")
            else:
                print("[CONFIG] Using patchright's default Chromium (built-in)")
        
        # Get the profile path based on browser and profile name
        browser_folder = get_browser_folder_name(browser_path)
        profile_path = get_profile_path(browser_folder, profile_name)
        print(f"[PROFILE] Profile path: {profile_path}")
        
        # Set launch parameters conditionally
        async with async_playwright() as playwright:
            if final_browser_path:
                print(f"[CONFIG] Using browser executable: {final_browser_path}")
                browser = await playwright.chromium.launch_persistent_context(
                    user_data_dir=str(profile_path),
                    headless=headless,
                    executable_path=final_browser_path
                )
            else:
                print(f"[CONFIG] Using built-in Chromium with profile: {profile_path}")
                browser = await playwright.chromium.launch_persistent_context(
                    user_data_dir=str(profile_path),
                    headless=headless
                )
            # wait 30 secconds
            # await asyncio.sleep(3)
            
            # context = await browser.new_context()
            page = await browser.new_page()
            
            print(f"[NAVIGATE] Navigating to {url}")
            await page.goto(url)
            
            print("[SUCCESS] Browser opened successfully")
            print("[INFO] Browser is now running. Close the browser window to exit.")
              # Keep process running until browser is closed
            # We'll use a simple mechanism to block until browser closes
            try:
                # Create a task to wait for browser disconnection
                disconnect_future: asyncio.Future[None] = asyncio.Future()
                
                # Set up an event handler that will be triggered when browser closes
                # browser.on("disconnected", lambda browser: disconnect_future.set_result(None) 
                #            if not disconnect_future.done() else None)
                
                # Wait indefinitely until browser disconnects
                await disconnect_future
            except Exception as e:
                print(f"Browser wait interrupted: {e}")
                # Just continue to exit normally
            
            print("[CLOSE] Browser closed")
            return 0
            
    except Exception as e:
        print(f"[ERROR] Error opening browser: {e}", file=sys.stderr)
        return 1
    
    return 0

def main():
    """
    Main entry point for the browser opener script.
    """
    from ..cli import parse_args
    args = parse_args()
    if args.command != 'browser':
        print('[ERROR] This script should be run with the "browser" command', file=sys.stderr)
        return 1
    return asyncio.run(open_browser(args.url, args.headless, args.browser_path or "", args.profile))

if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"[ERROR] Failed to open browser: {e}", file=sys.stderr)
        sys.exit(1)
