# WhiskeyBA - Browser Automation with Electron and BrowserUse

WhiskeyBA is an Electron-based browser that can be controlled via the [BrowserUse](https://github.com/browser-use/browser-use) Python framework, allowing for both manual browsing and automated browser tasks.

## Features

- Modern Electron-based web browser
- Built-in AI prompt interface for automation commands
- Support for external automation via BrowserUse Python framework
- **Isolated webview that can be controlled without affecting the UI**
- Dark/Light mode support
- Organized Python automation modules for code reuse
- Integrated browser opening capability
- Tab management
- Bookmark management with local storage
- Command history and suggestions in AI interface
- User preferences storage
- Clean separation between automation control and browser UI (see [Architecture](docs/architecture.md))

## Using with BrowserUse

This browser exposes a Chrome DevTools Protocol (CDP) endpoint that allows external tools like BrowserUse to control it.

### Steps to use with BrowserUse:

1. **Launch the WhiskeyBA browser**

   - The browser will start with remote debugging enabled on port 9222
   - Find the debugging URL in the sidebar under "Automation" section

2. **Install BrowserUse in your Python environment**

   ```bash
   pip install browser-use
   ```

3. **Use the provided example script**

   - Open `example_browser_use.py` and update it with your task
   - Make sure to set up your API keys in a `.env` file for the LLM provider you want to use

4. **Run your Python script**
   ```bash
   python example_browser_use.py
   ```

### Example Python Code:

```python
import asyncio
from dotenv import load_dotenv
load_dotenv()

from python.automation.browser_use import Agent, BrowserConfig, Browser
from langchain_openai import ChatOpenAI

async def main():
    # Connect to the Electron browser instance
    config = BrowserConfig(
        cdp_url="http://localhost:9222"  # Use the URL from the sidebar
    )

    browser = Browser(config=config)

    agent = Agent(
        task="Your automation task here",
        llm=ChatOpenAI(model="gpt-4o"),
        browser=browser
    )
    await agent.run()

if __name__ == "__main__":
    asyncio.run(main())
```

## Using the AI Prompt Interface

WhiskeyBA includes a built-in AI prompt interface that allows you to control the browser using natural language commands:

1. **Access the AI Prompt Interface**

   - Click the assistant icon in the bottom right corner of the browser window
   - The AI prompt panel will open

2. **Enter Your Commands**

   - Type your request in natural language (e.g., "Search for Italian restaurants in New York")
   - The AI will process your request and control the browser to complete the task

3. **View Results**
   - The AI will respond with updates as it works through your request
   - The browser will be controlled automatically to fulfill your task

The AI prompt interface is isolated from the browser automation control, ensuring that the AI can only control the browsing content but not the interface itself.

## Development

This project uses:

- Electron for the browser framework
- React for the UI
- TypeScript for type safety
- BrowserUse Python framework for browser automation

To build and run:

```bash
# Install dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt
pip install -e .

# Run in development mode
npm run dev

# Build for production
npm run build
```

## Storage Features

WhiskeyBA includes several local storage features to enhance the user experience:

### Bookmarks

- Add bookmarks via the bookmark icon in the address bar
- View and manage bookmarks in the bookmarks bar
- Bookmarks are stored persistently using localStorage

### AI Command History

- Previous automation commands are saved in the AI interface
- Access command history via the history button in the AI panel
- Use suggested commands for common automation tasks

### User Preferences

The browser stores user preferences including:

- Default search engine
- Home page URL
- UI theme settings
- Bookmarks bar visibility
- Tab behavior settings

All settings are stored locally and persist between sessions.

## Python Modules Organization

WhiskeyBA includes a structured Python module organization for browser automation:

### Python Components

The project includes a unified Python application with a modular architecture:

- **python/** - Main Python package directory
  - **src/** - Source code organized by functionality
    - **app.py** - Unified command dispatcher with CLI interface
    - **automation/** - Browser automation modules
    - **browser/** - Browser control modules
    - **common/** - Shared configuration and utilities
    - **utils/** - Utility functions and helpers
  - **dist/** - Compiled executable (generated when built)
  - `whiskey_app.py` - Main entry point for the unified application
  - `build_all.py` - Script to compile the unified Python executable

### Building Python Components

```bash
# Build all Python components
npm run build:python

# Or from the python directory
cd python
python build_all.py
```

### Using in Your Scripts

```python
# Import directly from modules
from python.src.automation.browser_automation import run_automation
from python.src.browser.opener import open_browser
```

## Contributing

If you're interested in contributing to WhiskeyBA, please see our [Contributing Guidelines](CONTRIBUTING.md) for more information on how to get started.

## Architecture

WhiskeyBA is designed with a clear separation between the browser UI and the web content that can be controlled by AI. The [Architecture Documentation](docs/architecture.md) provides a detailed explanation of how this isolation works.
