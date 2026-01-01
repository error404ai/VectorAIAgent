#!/usr/bin/env python
"""
Main entry point for the WhiskeyBA Python application.
This module provides a unified interface for all WhiskeyBA functionality,
allowing different operations to be performed based on command-line arguments.
"""

# CRITICAL: Import patchright integration FIRST, before any other imports
# This ensures anti-detection is enabled before browser-use modules are loaded
from .utils.patchright_integration import enable_patchright
enable_patchright()

import argparse
import sys
import asyncio
import logging
import json

# Import functionality from various modules
from .common.config import initialize_paths
from .browser.opener import open_browser
from .automation.browser_automation import run_automation
from .utils.user_profile import list_chrome_profiles, create_chrome_profile, delete_chrome_profile, delete_all_chrome_profiles
from .utils.chromium_manager import check_chromium_status, install_chromium, uninstall_chromium
from . import cli

def setup_logging() -> None:
    """Configure logging for the application"""
    # Create a custom handler that flushes
    class FlushingStreamHandler(logging.StreamHandler):
        def emit(self, record):
            super().emit(record)
            self.flush()
    
    logging.basicConfig(
        level=logging.DEBUG,  # Changed to DEBUG to capture agent step logs
        handlers=[FlushingStreamHandler(sys.stdout)],
        format='%(levelname)s: %(message)s'
    )

    # Initialize UTF-8 output for Windows
    if sys.stdout and hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding='utf-8')  # type: ignore


async def main_async() -> int:
    """
    Async entry point for the application.
    Returns the exit code.
    """
    # Set up logging
    setup_logging()
    
    try:
        # Initialize paths
        paths: dict[str, str] = initialize_paths()
        if not paths:
            print("[ERROR] Failed to initialize paths", file=sys.stderr, flush=True)
            return 1
            
        # Log the environment information
        print(f"[INFO] Running on Python {sys.version.split()[0]}", flush=True)
        print(f"[INFO] Platform: {sys.platform}", flush=True)
        print(f"[INFO] Driver path: {paths.get('driver_path', 'Not set')}", flush=True)
        
        # Parse command line arguments
        args: argparse.Namespace = cli.parse_args()
        
        # Execute the appropriate command
        if args.command == 'automation':
            # Run browser automation
            print(f"[START] Running browser automation with prompt: {args.prompt}", flush=True)
            # Check if browser_path is provided
            browser_path = args.browser_path if hasattr(args, 'browser_path') and args.browser_path else ""
            if browser_path:
                print(f"[CONFIG] Using custom browser path for automation: {browser_path}", flush=True)
            
            # Get the profile name if provided
            profile_name = args.profile if hasattr(args, 'profile') else "default_profile"
            
            # Convert use_vision string to boolean
            use_vision = args.use_vision.lower() == 'true' if hasattr(args, 'use_vision') else True
            # Determine wait_between_actions if provided
            wait_between_actions = args.wait_between_actions if hasattr(args, 'wait_between_actions') else 0.5
            use_wallet = args.use_wallet.lower() == 'true' if hasattr(args, 'use_wallet') else False
            wallet_public_key = getattr(args, 'wallet_public_key', None)
            wallet_secret_env = getattr(args, 'wallet_secret_env', None)
            wallet_secret_key = getattr(args, 'wallet_secret_key', None)
            upload_directory = getattr(args, 'upload_directory', None)
            
            print("wallet_public_key:", wallet_public_key, flush=True)
            print("wallet_secret_env:", wallet_secret_env, flush=True)
            print("wallet_secret_key:", wallet_secret_key, flush=True)
            if upload_directory:
                print("[FILES] Upload directory configured:", upload_directory, flush=True)

            result = await run_automation(
                prompt=args.prompt, 
                port=args.port, 
                provider=args.provider, 
                model=args.model, 
                api_key=args.api_key, 
                base_url=args.base_url, 
                temperature=args.temperature, 
                max_tokens=args.max_tokens,
                browser_path=browser_path,
                profile_name=profile_name,
                use_vision=use_vision,
                wait_between_actions=wait_between_actions,
                use_wallet=use_wallet,
                wallet_public_key=wallet_public_key,
                wallet_secret_env=wallet_secret_env,
                wallet_secret_key=wallet_secret_key,
                upload_directory=upload_directory
            )
            return 0 if result.get('success', False) else 1
            
        elif args.command == 'browser':
            # Open a browser
            print(f"[BROWSER] Opening browser at URL: {args.url}", flush=True)
            browser_path = args.browser_path if hasattr(args, 'browser_path') else ""
            profile_name = args.profile if hasattr(args, 'profile') else "default_profile"
            if browser_path:
                print(f"[CONFIG] Using custom browser path: {browser_path}", flush=True)
            print(f"[PROFILE] Using profile: {profile_name}", flush=True)
            result = await open_browser(args.url, args.headless, browser_path, profile_name)
            return result
            
        elif args.command == 'profiles':
            # Handle profile management
            browser_path = args.browser_path if hasattr(args, 'browser_path') and args.browser_path else ""
            
            if args.list:
                # List all available profiles
                profiles = list_chrome_profiles()
                print(json.dumps(profiles))
                return 0
            elif args.create:
                # Create a new profile
                try:
                    print(f"[CONFIG] Creating new browser profile: {args.create}")
                    if browser_path:
                        print(f"[CONFIG] Using browser path: {browser_path}")
                    profile_dir = await create_chrome_profile(args.create, browser_path=browser_path)
                    print(f"[SUCCESS] Created profile: {args.create} at {profile_dir}")
                    return 0
                except Exception as e:
                    print(f"[ERROR] Failed to create profile: {e}", file=sys.stderr)
                    return 1
            elif args.delete:
                # Delete an existing profile
                try:
                    profile_name = args.delete
                    print(f"[DELETE] Deleting browser profile: {profile_name}")
                    if browser_path:
                        print(f"[CONFIG] Using browser path: {browser_path}")
                    
                    # Don't delete the default profile
                    if profile_name == "default_profile":
                        print("[ERROR] Cannot delete the default profile")
                        return 1
                    
                    success = delete_chrome_profile(profile_name, browser_path=browser_path)
                    
                    if success:
                        print(f"[SUCCESS] Deleted profile: {profile_name}")
                        return 0
                    else:
                        print(f"[ERROR] Failed to delete profile: {profile_name}")
                        return 1
                except Exception as e:
                    print(f"[ERROR] Error deleting profile: {e}", file=sys.stderr)
                    return 1
            elif args.delete_all:
                # Delete all browser profiles
                try:
                    print("[DELETE] Deleting all browser profiles...")
                    
                    success = delete_all_chrome_profiles()
                    
                    if success:
                        print("[SUCCESS] All browser profiles deleted successfully")
                        return 0
                    else:
                        print("[ERROR] Failed to delete all browser profiles")
                        return 1
                except Exception as e:
                    print(f"[ERROR] Error deleting all profiles: {e}", file=sys.stderr)
                    return 1
            else:
                print("[ERROR] No profile action specified. Use --list, --create, --delete, or --delete-all")
                return 1
                
        elif args.command == 'chromium':
            # Handle Chromium management
            if args.status:
                # Check Chromium installation status
                status = await check_chromium_status()
                print(json.dumps(status, indent=2))
                return 0
            elif args.install:
                # Install Chromium browser
                try:
                    print("[INSTALL] Installing Chromium browser...")
                    result = await install_chromium()
                    print(json.dumps(result, indent=2))
                    return 0 if result.get('success', False) else 1
                except Exception as e:
                    print(f"[ERROR] Failed to install Chromium: {e}", file=sys.stderr)
                    return 1
            elif args.uninstall:
                # Uninstall Chromium browser
                try:
                    print("[UNINSTALL] Uninstalling Chromium browser...")
                    result = await uninstall_chromium()
                    print(json.dumps(result, indent=2))
                    return 0 if result.get('success', False) else 1
                except Exception as e:
                    print(f"[ERROR] Failed to uninstall Chromium: {e}", file=sys.stderr)
                    return 1
            else:
                print("[ERROR] No Chromium action specified. Use --status, --install, or --uninstall")
                return 1
                
        elif args.command == 'wallet':
            # Handle wallet management
            from .utils.wallet_manager import WalletManager
            
            if args.generate:
                # Generate a new wallet
                try:
                    print(f"[WALLET] Generating new wallet: {args.generate}")
                    result = WalletManager.generate_wallet(args.generate)
                    print(json.dumps(result, indent=2))
                    return 0 if result.get('success', False) else 1
                except Exception as e:
                    print(f"[ERROR] Failed to generate wallet: {e}", file=sys.stderr)
                    return 1
            elif args.balance:
                # Check wallet balance
                try:
                    print(f"[WALLET] Checking balance for: {args.balance}")
                    result = await WalletManager.get_wallet_balance(args.balance, args.rpc_url)
                    print(json.dumps(result, indent=2))
                    return 0 if result.get('success', False) else 1
                except Exception as e:
                    print(f"[ERROR] Failed to check balance: {e}", file=sys.stderr)
                    return 1
            else:
                print("[ERROR] No wallet action specified. Use --generate or --balance")
                return 1
                
        else:
            print(f"[ERROR] Unknown command: {args.command}")
            return 1
            
    except Exception as e:
        print(f"[ERROR] Error executing command: {e}", file=sys.stderr)
        return 1

def main() -> int:
    """
    Synchronous entry point for the application.
    Returns the exit code.
    """
    try:
        return asyncio.run(main_async())
    except Exception as e:
        print(f"[ERROR] Fatal error: {e}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())
