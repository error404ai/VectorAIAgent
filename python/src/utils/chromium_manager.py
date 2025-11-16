#!/usr/bin/env python
# filepath: c:\Projects\WhiskeyBA\python\src\utils\chromium_manager.py
"""
Chromium browser management utilities for WhiskeyBA.
Handles installation, uninstallation, and status checking of Chromium browser.
"""
import os
import sys
import asyncio
import subprocess
import json
import shutil
from pathlib import Path
from typing import Dict, Union, Optional

def get_whiskey_browsers_path() -> Path:
    """
    Get the standard Windows path for WhiskeyBA browser installations.
    Uses %LOCALAPPDATA%\\WhiskeyBA\\Browsers for proper Windows compliance.
    """
    if sys.platform == "win32":
        # Use Windows standard location: %LOCALAPPDATA%\WhiskeyBA\Browsers
        local_app_data = os.environ.get('LOCALAPPDATA')
        if local_app_data:
            browsers_path = Path(local_app_data) / "WhiskeyBA" / "Browsers"
        else:
            # Fallback if LOCALAPPDATA is not set
            home_dir = Path.home()
            browsers_path = home_dir / "AppData" / "Local" / "WhiskeyBA" / "Browsers"
    else:
        # For non-Windows systems, use XDG standard
        xdg_data_home = os.environ.get('XDG_DATA_HOME')
        if xdg_data_home:
            browsers_path = Path(xdg_data_home) / "WhiskeyBA" / "Browsers"
        else:
            browsers_path = Path.home() / ".local" / "share" / "WhiskeyBA" / "Browsers"
    
    # Create directory if it doesn't exist
    browsers_path.mkdir(parents=True, exist_ok=True)
    return browsers_path

def get_chromium_install_path() -> Path:
    """Get the path where Chromium should be installed."""
    return get_whiskey_browsers_path() / "Chromium"

async def check_chromium_status() -> Dict[str, Union[bool, str]]:
    """
    Check if Chromium is installed in WhiskeyBA's dedicated directory.
    
    Returns:
        Dictionary with installation status information
    """
    try:
        # Get our dedicated installation directory (parent of chromium_path)
        browsers_dir = get_chromium_install_path().parent
        
        print(f"[SEARCH] Checking for Chromium in: {browsers_dir}")
        
        if not browsers_dir.exists():
            return {
                "isInstalled": False,
                "message": f"Browser directory does not exist: {browsers_dir}"
            }
        
        # Search for Chromium executables in all subdirectories
        if sys.platform == "win32":
            executable_names = ["chrome.exe", "chromium.exe"]
        else:
            executable_names = ["chrome", "chromium"]
        
        found_executables = []
        
        # Search recursively for browser executables
        for exe_name in executable_names:
            for exe_path in browsers_dir.rglob(exe_name):
                if exe_path.is_file():
                    found_executables.append(exe_path)
                    print(f"[FOUND] Found potential executable: {exe_path}")
        
        # Try each found executable to see if it's a valid Chromium browser
        for exe_path in found_executables:
            try:
                print(f"[TEST] Testing executable: {exe_path}")
                
                # Try to get version to verify it's a working browser
                version_result = subprocess.run(
                    [str(exe_path), "--version"],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                if version_result.returncode == 0:
                    version_output = version_result.stdout.strip()
                    print(f"[SUCCESS] Valid Chromium found: {version_output}")
                    
                    return {
                        "isInstalled": True,
                        "version": version_output,
                        "installPath": str(exe_path),
                        "message": f"Chromium found at {exe_path}"
                    }
                else:
                    print(f"[WARNING] Executable at {exe_path} returned non-zero exit code: {version_result.returncode}")
                    
            except subprocess.TimeoutExpired:
                print(f"[WARNING] Version check timed out for {exe_path}")
                # Still consider it valid if it exists and we can't get version
                return {
                    "isInstalled": True,
                    "version": "Unknown (timeout during version check)",
                    "installPath": str(exe_path),
                    "message": f"Chromium found at {exe_path} (version check timed out)"
                }
            except Exception as e:
                print(f"[WARNING] Error testing {exe_path}: {e}")
                continue
        
        # If we get here, no valid Chromium executable was found
        if found_executables:
            return {
                "isInstalled": False,
                "message": f"Found {len(found_executables)} potential executables but none were valid Chromium browsers"
            }
        else:
            return {
                "isInstalled": False,
                "message": f"No Chromium executables found in {browsers_dir}"
            }
        
    except Exception as e:
        return {
            "isInstalled": False,
            "message": f"Error checking Chromium status: {str(e)}"
        }
        return {
            "isInstalled": False,
            "message": f"Error checking Chromium status: {str(e)}"
        }

async def install_chromium() -> Dict[str, Union[bool, str, int]]:
    """
    Install Chromium browser to WhiskeyBA's dedicated directory.
    Tries multiple methods in order:
    1. Patchright Python API
    2. Playwright Python API  
    3. Direct download from Google
    
    Returns:
        Dictionary with installation result
    """
    try:
        print("[INSTALL] Starting Chromium installation...")
        
        # Get our dedicated installation path
        chromium_path = get_chromium_install_path()
        
        # Create the directory if it doesn't exist
        chromium_path.parent.mkdir(parents=True, exist_ok=True)
        
        print(f"[PATH] Installing Chromium to: {chromium_path}")
        
        # Helper function to verify installation
        def find_chromium_executable(search_path: Path) -> Optional[Path]:
            """Find Chromium executable in the directory tree."""
            if not search_path.exists():
                return None
            
            exe_names = ["chrome.exe", "chromium.exe"] if sys.platform == "win32" else ["chrome", "chromium"]
            
            # Search recursively for any chromium executable
            for exe_name in exe_names:
                for exe_path in search_path.rglob(exe_name):
                    if exe_path.is_file():
                        # Verify it's actually executable by checking if we can get version
                        try:
                            version_result = subprocess.run(
                                [str(exe_path), "--version"],
                                capture_output=True,
                                text=True,
                                timeout=10
                            )
                            if version_result.returncode == 0:
                                return exe_path
                        except Exception:
                            continue  # Try next executable
            return None
        
        # Method 1: Try patchright Python API
        try:
            print("[METHOD1] Method 1: Trying patchright Python API...")
            from patchright._impl._driver import Driver
            
            print("[DOWNLOAD] Using patchright Driver to install Chromium...")
            
            # Create a driver instance and install chromium
            driver = Driver()
            
            # Set environment for the driver
            original_env = os.environ.get("PLAYWRIGHT_BROWSERS_PATH")
            os.environ["PLAYWRIGHT_BROWSERS_PATH"] = str(chromium_path.parent)
            
            try:
                # Install chromium browser - this will download and extract it
                print("[DOWNLOAD] Downloading and installing Chromium browser...")
                driver.install(["chromium"])
                print("[SUCCESS] Patchright installation completed")
                
            finally:
                # Restore original environment
                if original_env is not None:
                    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = original_env
                elif "PLAYWRIGHT_BROWSERS_PATH" in os.environ:
                    del os.environ["PLAYWRIGHT_BROWSERS_PATH"]
            
            # Verify the installation
            found_executable = find_chromium_executable(chromium_path.parent)
            
            if found_executable:
                print(f"[SUCCESS] Successfully found Chromium executable at: {found_executable}")
                
                # Get version
                version = "Unknown"
                try:
                    version_result = subprocess.run(
                        [str(found_executable), "--version"],
                        capture_output=True,
                        text=True,
                        timeout=10
                    )
                    if version_result.returncode == 0:
                        version = version_result.stdout.strip()
                except Exception as e:
                    print(f"Warning: Could not get Chromium version: {e}")
                
                return {
                    "success": True,
                    "message": f"Chromium installed successfully via patchright to {found_executable}",
                    "progress": 100,
                    "status": {
                        "isInstalled": True,
                        "version": version,
                        "installPath": str(found_executable),
                    }
                }
            else:
                print("[ERROR] Patchright installation completed but no Chromium executable found")
                
        except ImportError as import_error:
            print(f"[ERROR] Patchright not available: {import_error}")
        except Exception as driver_error:
            print(f"[ERROR] Patchright installation error: {driver_error}")
        
        # Method 2: Try playwright Python API
        try:
            print("[METHOD2] Method 2: Trying playwright Python API...")
            from playwright._impl._driver import Driver as PlaywrightDriver
            
            driver = PlaywrightDriver()
            
            # Set environment
            original_env = os.environ.get("PLAYWRIGHT_BROWSERS_PATH")
            os.environ["PLAYWRIGHT_BROWSERS_PATH"] = str(chromium_path.parent)
            
            try:
                driver.install(["chromium"])
                print("[SUCCESS] Playwright installation completed")
            finally:
                # Restore environment
                if original_env is not None:
                    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = original_env
                elif "PLAYWRIGHT_BROWSERS_PATH" in os.environ:
                    del os.environ["PLAYWRIGHT_BROWSERS_PATH"]
            
            # Verify installation
            found_executable = find_chromium_executable(chromium_path.parent)
            
            if found_executable:
                version = "Unknown"
                try:
                    version_result = subprocess.run(
                        [str(found_executable), "--version"],
                        capture_output=True,
                        text=True,
                        timeout=10
                    )
                    if version_result.returncode == 0:
                        version = version_result.stdout.strip()
                except Exception:
                    pass
                
                return {
                    "success": True,
                    "message": f"Chromium installed successfully via playwright to {found_executable}",
                    "progress": 100,
                    "status": {
                        "isInstalled": True,
                        "version": version,
                        "installPath": str(found_executable),
                    }
                }
            else:
                print("[ERROR] Playwright installation completed but no Chromium executable found")
                
        except ImportError as playwright_error:
            print(f"[ERROR] Playwright not available: {playwright_error}")
        except Exception as playwright_error:
            print(f"[ERROR] Playwright installation error: {playwright_error}")
        
        # Method 3: Direct download from Google (fallback for systems without patchright/playwright)
        print("[METHOD3] Method 3: Trying direct download from Google...")
        return await install_chromium_direct_download(chromium_path)
        
    except Exception as e:
        error_msg = f"Error during Chromium installation: {str(e)}"
        print(f"[ERROR] {error_msg}")
        return {
            "success": False,
            "message": error_msg,
            "progress": 0
        }


async def install_chromium_direct_download(chromium_path: Path) -> Dict[str, Union[bool, str, int]]:
    """
    Direct download and extraction of Chromium from Google's servers.
    This is a fallback method that doesn't rely on patchright or playwright.
    """
    import urllib.request
    import zipfile
    import tempfile
    
    try:
        print("[DOWNLOAD] Starting direct download from Google servers...")
        
        # Determine the download URL based on the platform
        if sys.platform == "win32":
            # Get the latest stable Chromium build for Windows
            # We'll use a known stable build URL format
            base_url = "https://storage.googleapis.com/chromium-browser-snapshots/Win_x64"
            
            # Try to get the latest revision number
            try:
                last_change_url = f"{base_url}/LAST_CHANGE"
                with urllib.request.urlopen(last_change_url) as response:
                    revision = response.read().decode().strip()
                print(f"[INFO] Latest Chromium revision: {revision}")
            except Exception as e:
                print(f"[WARNING] Could not get latest revision, using known stable build: {e}")
                # Use a known stable revision as fallback
                revision = "1298734"  # This is a reasonably recent stable build
            
            # Build download URL
            zip_filename = f"chrome-win.zip"
            download_url = f"{base_url}/{revision}/{zip_filename}"
            
        else:
            return {
                "success": False,
                "message": "Direct download is currently only supported on Windows",
                "progress": 0
            }
        
        print(f"[DOWNLOAD] Downloading from: {download_url}")
        
        # Create temporary file for download
        with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as temp_file:
            temp_path = Path(temp_file.name)
        
        try:
            # Download the file with progress tracking
            def download_progress(block_num, block_size, total_size):
                if total_size > 0:
                    percent = min(100, (block_num * block_size * 100) // total_size)
                    if percent % 10 == 0 or percent > 90:  # Print every 10% or in final stages
                        print(f"[DOWNLOAD] Download progress: {percent}%")
            
            print("[DOWNLOAD] Starting download...")
            urllib.request.urlretrieve(download_url, temp_path, download_progress)
            print("[SUCCESS] Download completed")
            
            # Extract the zip file
            print(f"[EXTRACT] Extracting to: {chromium_path}")
            chromium_path.mkdir(parents=True, exist_ok=True)
            
            with zipfile.ZipFile(temp_path, 'r') as zip_ref:
                zip_ref.extractall(chromium_path)
            
            print("[SUCCESS] Extraction completed")
            
            # Look for the extracted executable
            exe_names = ["chrome.exe", "chromium.exe"] if sys.platform == "win32" else ["chrome", "chromium"]
            found_executable = None
            
            for exe_name in exe_names:
                for exe_path in chromium_path.rglob(exe_name):
                    if exe_path.is_file():
                        found_executable = exe_path
                        break
                if found_executable:
                    break
            
            if found_executable:
                print(f"[SUCCESS] Successfully found Chromium executable at: {found_executable}")
                
                # Get version
                version = "Unknown"
                try:
                    version_result = subprocess.run(
                        [str(found_executable), "--version"],
                        capture_output=True,
                        text=True,
                        timeout=10
                    )
                    if version_result.returncode == 0:
                        version = version_result.stdout.strip()
                except Exception as e:
                    print(f"Warning: Could not get Chromium version: {e}")
                
                return {
                    "success": True,
                    "message": f"Chromium installed successfully via direct download to {found_executable}",
                    "progress": 100,
                    "status": {
                        "isInstalled": True,
                        "version": version,
                        "installPath": str(found_executable),
                    }
                }
            else:
                print("[ERROR] Extraction completed but no Chromium executable found")
                
                # List what was extracted for debugging
                print("[DEBUG] Contents of extraction directory:")
                for item in chromium_path.rglob("*"):
                    if item.is_file():
                        print(f"  [FILE] {item.relative_to(chromium_path)}")
                    elif item.is_dir():
                        print(f"  [DIR] {item.relative_to(chromium_path)}/")
                
                return {
                    "success": False,
                    "message": "Chromium downloaded and extracted but executable not found",
                    "progress": 90
                }
                
        finally:
            # Clean up temporary file
            try:
                temp_path.unlink()
            except Exception:
                pass
                
    except Exception as e:
        error_msg = f"Direct download failed: {str(e)}"
        print(f"[ERROR] {error_msg}")
        return {
            "success": False,
            "message": error_msg,
            "progress": 0
        }

async def uninstall_chromium() -> Dict[str, Union[bool, str]]:
    """
    Uninstall Chromium browser from WhiskeyBA's dedicated directory.
    
    Returns:
        Dictionary with uninstallation result
    """
    try:
        print("[UNINSTALL] Starting Chromium uninstallation...")
        
        # Get our dedicated installation path
        chromium_path = get_chromium_install_path()
        browsers_path = get_whiskey_browsers_path()
        
        removed_paths = []
        
        # Remove our dedicated Chromium directory
        if chromium_path.exists():
            try:
                print(f"[DELETE] Removing Chromium directory: {chromium_path}")
                shutil.rmtree(chromium_path, ignore_errors=True)
                removed_paths.append(str(chromium_path))
                print(f"[SUCCESS] Removed {chromium_path}")
            except Exception as e:
                print(f"[WARNING] Warning: Could not completely remove {chromium_path}: {e}")
        
        # Also look for any chromium-related directories in the browsers path
        try:
            if browsers_path.exists():
                for item in browsers_path.iterdir():
                    if item.is_dir() and "chromium" in item.name.lower():
                        try:
                            print(f"[DELETE] Removing additional Chromium directory: {item}")
                            shutil.rmtree(item, ignore_errors=True)
                            removed_paths.append(str(item))
                        except Exception as e:
                            print(f"[WARNING] Warning: Could not remove {item}: {e}")
        except Exception as e:
            print(f"[WARNING] Warning: Could not scan browsers directory: {e}")
        
        # Try to use playwright/patchright API for cleanup (if available)
        try:
            # Try patchright first
            try:
                from patchright._impl._driver import Driver
                # Note: There's no direct uninstall method, but removing files is sufficient
                print("[SUCCESS] Patchright API available for future cleanup operations")
            except ImportError:
                try:
                    from playwright._impl._driver import Driver
                    print("[SUCCESS] Playwright API available for future cleanup operations")
                except ImportError:
                    print("[INFO] Neither patchright nor playwright API available for cleanup")
        except Exception as e:
            print(f"[INFO] Browser API cleanup not needed: {e}")
        
        # Verify uninstallation
        verification_status = await check_chromium_status()
        
        if not verification_status.get("isInstalled", True):
            message = "Chromium uninstalled successfully"
            if removed_paths:
                message += f". Removed directories: {', '.join(removed_paths)}"
            
            print(f"[SUCCESS] {message}")
            return {
                "success": True,
                "message": message
            }
        else:
            print("[WARNING] Chromium may still be partially installed")
            return {
                "success": True,  # Partial success
                "message": "Chromium partially uninstalled. Some files may remain."
            }
            
    except Exception as e:
        error_msg = f"Error during Chromium uninstallation: {str(e)}"
        print(f"[ERROR] {error_msg}")
        return {
            "success": False,
            "message": error_msg
        }

def get_chromium_executable_path() -> Optional[str]:
    """
    Get the path to the installed Chromium executable.
    Returns None if not installed.
    """
    try:
        # First, try our dedicated installation directory
        chromium_path = get_chromium_install_path()
        
        # Look for common executable names
        if sys.platform == "win32":
            exe_names = ["chrome.exe", "chromium.exe"]
        else:
            exe_names = ["chrome", "chromium"]
        
        # Search in the installation directory and subdirectories
        for exe_name in exe_names:
            for exe_path in chromium_path.rglob(exe_name):
                if exe_path.is_file() and os.access(exe_path, os.X_OK):
                    return str(exe_path)
        
        # If not found in our directory, try to use playwright to find it
        try:
            # Set the environment to our installation path
            env = os.environ.copy()
            env["PLAYWRIGHT_BROWSERS_PATH"] = str(chromium_path.parent)
            
            # Try using playwright API
            from playwright.sync_api import sync_playwright
            with sync_playwright() as p:
                try:
                    executable_path = p.chromium.executable_path
                    if os.path.exists(executable_path):
                        return executable_path
                except Exception:
                    pass
        except ImportError:
            pass
        
        return None
        
    except Exception as e:
        print(f"Error getting installed Chromium path: {e}")
        return None

def main():
    """Main function for testing chromium management functions."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Chromium management utility')
    parser.add_argument('action', choices=['status', 'install', 'uninstall'], 
                       help='Action to perform')
    
    args = parser.parse_args()
    
    async def run_action():
        if args.action == 'status':
            result = await check_chromium_status()
            print(json.dumps(result, indent=2))
        elif args.action == 'install':
            result = await install_chromium()
            print(json.dumps(result, indent=2))
        elif args.action == 'uninstall':
            result = await uninstall_chromium()
            print(json.dumps(result, indent=2))
    
    asyncio.run(run_action())

if __name__ == "__main__":
    main()
