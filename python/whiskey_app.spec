# filepath: c:\Projects\WhiskeyBA\python\whiskey_app.spec
# -*- mode: python ; coding: utf-8 -*-
import os
from pathlib import Path
import playwright

# Import essential paths from browser_automation.spec
agent_path = os.path.abspath("browser-use-whiskyba/browser_use/agent")
playwright_dir = Path(playwright.__file__).parent
driver_dir = playwright_dir / "driver"
internal_dom_path = os.path.abspath("browser-use-whiskyba/browser_use/dom")

# Essential data files for browser automation
datas = [
    (os.path.join(agent_path, 'system_prompt.md'), os.path.join('browser_use', 'agent')),
    # Include the entire Playwright driver directory 
    (str(driver_dir), "playwright/driver"),
    # Explicitly include the package directory which contains cli.js
    (str(driver_dir / "package"), "playwright/driver/package"),
    # (os.path.join(internal_dom_path, 'buildDomTree.js'), 'browser_use/dom'),
]

block_cipher = None

a = Analysis(
    ['whiskey_app.py'],
    pathex=['browser-use-whiskyba'],
    binaries=[],
    datas=datas,
    hiddenimports=[
        'patchright',
        'patchright.async_api',
        'patchright.sync_api',
        'browser_use',
        'browser_use.llm',
        'browser_use.llm.openai',
        'browser_use.llm.anthropic',
        'browser_use.llm.google',
        'browser_use.llm.deepseek',
        'browser_use.llm.openrouter',
        'playwright',
        "playwright._impl._api_types",
        "playwright._impl._driver",
        "playwright._impl._sync_base",
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='whiskey_app',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
