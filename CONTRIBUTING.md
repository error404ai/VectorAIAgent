# Contributing to WhiskeyBA

Thank you for your interest in contributing to WhiskeyBA! This document provides guidelines and information for contributors.

## Architecture Overview

WhiskeyBA is an Electron-based browser that integrates with the BrowserUse Python framework for automation. For a detailed architecture explanation, see the [Architecture Documentation](docs/architecture.md).

## Development Environment Setup

1. **Prerequisites**:

   - Node.js 18+
   - Python 3.11+
   - Git

2. **Installing Dependencies**:

   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/WhiskeyBA.git
   cd WhiskeyBA

   # Install Node.js dependencies
   npm install

   # Install Python dependencies
   python setup_browser_use.py
   ```

3. **Running in Development Mode**:

   ```bash
   npm run dev
   ```

4. **Building for Production**:
   ```bash
   npm run build
   ```

## Project Structure

- `/src/electron` - Electron main process code
- `/src/ui` - React-based UI components
- `/types` - TypeScript type definitions
- `/docs` - Project documentation

## Key Components

### Browser Components

- **BrowserLayout**: Main layout container for the browser
- **AddressBar**: URL input and navigation controls
- **BrowserContent**: Webview container for webpage rendering
- **TabBar**: Tab management UI

### AI Components

- **AIPromptInterface**: User interface for AI automation commands
- **PythonBrowserUseRunner**: Service for executing Python BrowserUse scripts

### Integration Points

- **CDP Endpoint**: Exposed on port 9222 for BrowserUse connection
- **Partitioned Webview**: Uses `persist:browserview` partition for isolation
- **IPC Handlers**: Facilitate communication between UI and Electron main process

## Coding Standards

- Use TypeScript for all JavaScript code
- Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages
- Write tests for new features
- Document public APIs and complex functionality

## Testing

1. **Unit Tests**:

   ```bash
   npm test
   ```

2. **Integration Tests**:

   ```bash
   npm run test:integration
   ```

3. **Manual Testing Checklist**:
   - Verify browser navigation (back, forward, refresh)
   - Test bookmark functionality
   - Check tab management
   - Verify AI prompt interface
   - Test BrowserUse integration

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

By contributing to WhiskeyBA, you agree that your contributions will be licensed under the project license.

## Support

If you have questions or need help, please open an issue on the repository.
