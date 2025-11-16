from pathlib import Path
from patchright.async_api import async_playwright
from typing import Dict, Optional, Any
import shutil
import json

base_dir = Path.home() / "AppData" / "Local" / "WhiskeyBA" / "ChromeProfiles"

def _get_browser_metadata_file(browser_folder: str) -> Path:
    """Get the path to the browser metadata file."""
    return base_dir / browser_folder / ".browser_info.json"

def _save_browser_metadata(browser_folder: str, browser_path: str, browser_name: str) -> None:
    """Save browser metadata to a file."""
    metadata_file = _get_browser_metadata_file(browser_folder)
    metadata = {
        "browser_path": browser_path,
        "browser_name": browser_name,
        "folder_name": browser_folder
    }
    
    # Ensure the browser folder exists
    browser_dir = base_dir / browser_folder
    browser_dir.mkdir(parents=True, exist_ok=True)
    
    # Write metadata
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)

def _load_browser_metadata(browser_folder: str) -> Optional[Dict[str, str]]:
    """Load browser metadata from file."""
    metadata_file = _get_browser_metadata_file(browser_folder)
    if metadata_file.exists():
        try:
            with open(metadata_file, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return None
    return None

def get_browser_folder_name(browser_path: str) -> str:
    """
    Generate a unique folder name based on browser executable path.
    
    Args:
        browser_path (str): Path to the browser executable
        
    Returns:
        str: Unique folder name for the browser
    """
    if not browser_path or browser_path.strip() == "":
        return "builtin_chromium"
    
    # Create a simple hash of the browser path that matches TypeScript implementation
    hash_val = 0
    for char in browser_path:
        hash_val = ((hash_val << 5) - hash_val) + ord(char)
        hash_val = hash_val & 0xFFFFFFFF  # Keep it as 32-bit integer
    
    # Convert to positive hex and pad to 8 characters
    hash_str = format(abs(hash_val) & 0xFFFFFFFF, '08x')[:8]
    
    # Extract browser name from path
    browser_name = Path(browser_path).stem.lower()
    
    # Clean browser name (remove version numbers, etc.)
    if "chrome" in browser_name:
        browser_name = "chrome"
    elif "edge" in browser_name or "msedge" in browser_name:
        browser_name = "edge"
    elif "firefox" in browser_name:
        browser_name = "firefox"
    elif "opera" in browser_name:
        browser_name = "opera"
    
    return f"{browser_name}_{hash_str}"

def get_profile_path(browser_folder: str, profile_name: str) -> Path:
    """
    Get the path to a specific profile directory.
    
    Args:
        browser_folder (str): The browser folder name
        profile_name (str): Name of the profile
        
    Returns:
        Path: Path to the profile directory
    """
    return base_dir / browser_folder / profile_name

async def create_chrome_profile(profile_name: str, app_name: str = "WhiskeyBA", browser_path: str = "") -> str:
    """
    Creates a Chrome-compatible user profile using Playwright and returns the path.

    Args:
        profile_name (str): Name of the profile (e.g., "bot1", "user_automation").
        app_name (str): Name of the application (default is "WhiskeyBA").
        browser_path (str): Path to the browser executable.

    Returns:
        str: Full path to the created Chrome profile directory.
    """
    browser_folder = get_browser_folder_name(browser_path)
    profile_dir: Path = base_dir / browser_folder / profile_name
    profile_dir.mkdir(parents=True, exist_ok=True)

    # Save browser metadata when creating the first profile for this browser
    if browser_path and browser_path.strip() != "":
        # Extract browser name from path
        browser_name = Path(browser_path).stem.lower()
        
        # Clean browser name (remove version numbers, etc.)
        if "chrome" in browser_name:
            browser_name = "chrome"
        elif "edge" in browser_name or "msedge" in browser_name:
            browser_name = "edge"
        elif "firefox" in browser_name:
            browser_name = "firefox"
        elif "opera" in browser_name:
            browser_name = "opera"
        
        _save_browser_metadata(browser_folder, browser_path, browser_name)
    else:
        # For builtin chromium
        _save_browser_metadata(browser_folder, "", "builtin_chromium")

    async with async_playwright() as p:
        if browser_path and browser_path.strip() != "":
            # Use the specified browser executable
            browser = await p.chromium.launch_persistent_context(
                user_data_dir=str(profile_dir),
                headless=True,
                executable_path=browser_path
            )
        else:
            raise ValueError("Browser path must be provided for creating a profile.")
        
        page = await browser.new_page()
        await page.goto("https://google.com") 
        await browser.close()

    return str(profile_dir)

async def get_chrome_profile(profile_name: str, app_name: str = "WhiskeyBA", browser_path: str = "") -> str:
    """
    Returns the path to an existing Chrome-compatible user profile directory.

    Args:
        profile_name (str): Name of the profile.
        app_name (str): Name of the application (default is "WhiskeyBA").
        browser_path (str): Path to the browser executable.

    Returns:
        str: Full path to the existing Chrome profile directory.

    Raises:
        FileNotFoundError: If the profile directory does not exist.
    """
    browser_folder = get_browser_folder_name(browser_path)
    profile_dir = base_dir / browser_folder / profile_name

    if profile_dir.exists() and profile_dir.is_dir():
        return str(profile_dir)
    else:
        # create and return
        return await create_chrome_profile(profile_name, app_name, browser_path)

def list_chrome_profiles(app_name: str = "WhiskeyBA") -> Dict[str, Dict[str, Any]]:
    """
    Lists all available Chrome-compatible profile names organized by browser folder
    with enhanced browser information.

    Args:
        app_name (str): Name of the application (default is "WhiskeyBA").

    Returns:
        Dict[str, Dict[str, any]]: Dictionary mapping browser folder names to browser info
        containing profiles, browser_path, and browser_name.
        
        Example:
        {
            "chrome_2f0be54f": {
                "profiles": ["profile1", "profile2"],
                "browser_path": "C:/Program Files/Google/Chrome/Application/chrome.exe",
                "browser_name": "chrome"
            },
            "builtin_chromium": {
                "profiles": ["default_profile"],
                "browser_path": "",
                "browser_name": "builtin_chromium"
            }
        }
    """
    if not base_dir.exists() or not base_dir.is_dir():
        # Return default structure if no profiles exist
        return {
            "builtin_chromium": {
                "profiles": ["default_profile"],
                "browser_path": "",
                "browser_name": "builtin_chromium"
            }
        }

    browser_profiles: Dict[str, Dict[str, Any]] = {}
    
    # Iterate through browser folders
    for browser_folder in base_dir.iterdir():
        if browser_folder.is_dir():
            # Get profiles (exclude metadata files)
            profiles = [
                p.name for p in browser_folder.iterdir() 
                if p.is_dir() and not p.name.startswith('.')
            ]
            
            if profiles:  # Only include browsers that have profiles
                # Load browser metadata - skip if no metadata exists
                metadata = _load_browser_metadata(browser_folder.name)
                
                if metadata:
                    browser_info: Dict[str, Any] = {
                        "profiles": profiles,
                        "browser_path": metadata.get("browser_path", ""),
                        "browser_name": metadata.get("browser_name", browser_folder.name)
                    }
                    browser_profiles[browser_folder.name] = browser_info
                else:
                    # Skip browsers without metadata - we can't determine their browser path
                    print(f"Skipping browser folder '{browser_folder.name}' - no metadata found")
                    continue
    
    # Ensure we always have at least the builtin chromium with default profile
    if not browser_profiles:
        browser_profiles["builtin_chromium"] = {
            "profiles": ["default_profile"],
            "browser_path": "",
            "browser_name": "builtin_chromium"
        }
    elif "builtin_chromium" not in browser_profiles:
        browser_profiles["builtin_chromium"] = {
            "profiles": ["default_profile"],
            "browser_path": "",
            "browser_name": "builtin_chromium"
        }
    
    return browser_profiles

def delete_chrome_profile(profile_name: str, app_name: str = "WhiskeyBA", browser_path: str = "") -> bool:
    """
    Deletes a Chrome profile directory.

    Args:
        profile_name (str): Name of the profile to delete.
        app_name (str): Name of the application (default is "WhiskeyBA").
        browser_path (str): Path to the browser executable.

    Returns:
        bool: True if the profile was successfully deleted, False otherwise.
    """
    # Don't delete the default profile
    if profile_name == "default_profile":
        return False

    browser_folder = get_browser_folder_name(browser_path)
    profile_dir = base_dir / browser_folder / profile_name

    if profile_dir.exists() and profile_dir.is_dir():
        try:
            # Use shutil.rmtree to delete the entire directory
            shutil.rmtree(profile_dir)
            return True
        except Exception as e:
            print(f"Error deleting profile {profile_name}: {str(e)}")
            return False
    else:
        # Profile doesn't exist, consider it a successful deletion
        return True

def delete_all_chrome_profiles(app_name: str = "WhiskeyBA") -> bool:
    """
    Deletes all browser profile directories and folders.
    This will remove the entire WhiskeyBA ChromeProfiles directory.

    Args:
        app_name (str): Name of the application (default is "WhiskeyBA").

    Returns:
        bool: True if all profiles were successfully deleted, False otherwise.
    """
    try:
        if base_dir.exists() and base_dir.is_dir():
            # Use shutil.rmtree to delete the entire ChromeProfiles directory
            shutil.rmtree(base_dir)
            print(f"[SUCCESS] Successfully deleted all browser profiles directory: {base_dir}")
            return True
        else:
            # Directory doesn't exist, consider it a successful deletion
            print(f"[INFO] Browser profiles directory doesn't exist: {base_dir}")
            return True
    except Exception as e:
        print(f"[ERROR] Error deleting all browser profiles: {str(e)}")
        return False
