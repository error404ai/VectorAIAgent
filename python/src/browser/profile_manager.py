#!/usr/bin/env python
# filepath: c:\Projects\WhiskeyBA\python\src\browser\profile_manager.py
"""
Browser profile management module.
"""
import argparse
import asyncio
import json
import sys
from typing import List

from ..utils.user_profile import list_chrome_profiles, create_chrome_profile, delete_all_chrome_profiles

async def list_profiles() -> List[str]:
    """
    List all available browser profiles.

    Returns:
        List[str]: List of profile names
    """
    profiles = list_chrome_profiles()
    print(f"Here are the profiles json: {json.dumps(profiles)}")
    profile_names = list(profiles.keys())
    return profile_names

async def create_profile(name: str) -> str:
    """
    Create a new browser profile.

    Args:
        name (str): Name of the profile to create

    Returns:
        str: Path to the created profile directory
    """
    try:
        profile_dir = await create_chrome_profile(name)
        print(f"Created profile: {name} at {profile_dir}")
        return profile_dir
    except Exception as e:
        print(f"Error creating profile: {str(e)}", file=sys.stderr)
        raise

async def delete_all_profiles() -> bool:
    """
    Delete all browser profiles.

    Returns:
        bool: True if all profiles were successfully deleted, False otherwise.
    """
    try:
        success = delete_all_chrome_profiles()
        if success:
            print("[SUCCESS] All browser profiles deleted successfully")
        else:
            print("[ERROR] Failed to delete all browser profiles")
        return success
    except Exception as e:
        print(f"[ERROR] Error deleting all profiles: {str(e)}", file=sys.stderr)
        return False

def main():
    """
    Main entry point for the profile manager CLI.
    """
    from ..cli import parse_args
    args = parse_args()
    if args.command != 'profiles':
        print('[ERROR] This script should be run with the "profiles" command')
        return

    if args.list:
        asyncio.run(list_profiles())
    elif args.create:
        asyncio.run(create_profile(args.create))
    elif args.delete_all:
        asyncio.run(delete_all_profiles())
    else:
        print('No action specified for profiles command')

if __name__ == "__main__":
    main()
