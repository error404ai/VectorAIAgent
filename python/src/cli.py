import argparse


def create_main_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description='WhiskeyBA Python application',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
            Examples:
            # Run browser automation with a specific task
            whiskey_app.exe automation --prompt "Search for Python tutorials"
            
            # Open a browser at a specific URL
            whiskey_app.exe browser --url "https://github.com"
        """
    )

    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    subparsers.required = True

    # Browser automation command
    automation_parser = subparsers.add_parser('automation', help='Run browser automation')
    automation_parser.add_argument('--prompt', type=str, required=True, help='The automation task to perform')
    automation_parser.add_argument('--port', type=int, default=9223, help='Chrome DevTools Protocol port')
    automation_parser.add_argument('--profile', type=str, default='default_profile', help='Chrome profile name to use')
    automation_parser.add_argument('--provider', type=str, default='openai', help='AI model provider (openai, anthropic, google, deepseek, openrouter, custom)')
    automation_parser.add_argument('--model', type=str, default='gpt-4o', help='Specific model to use')
    automation_parser.add_argument('--api-key', type=str, help='API key for the provider')
    automation_parser.add_argument('--base-url', type=str, help='Base URL for API (for custom providers or self-hosted models)')
    automation_parser.add_argument('--temperature', type=float, default=0.7, help='Temperature parameter for the model (0.0-1.0)')
    automation_parser.add_argument('--max-tokens', type=int, default=4096, help='Maximum tokens to generate')
    automation_parser.add_argument('--use-vision', type=str, default='true', help='Enable or disable vision capabilities for the model (true/false)')
    automation_parser.add_argument('--browser-path', type=str, help='Path to browser executable (for system browser)')
    automation_parser.add_argument('--wait-between-actions', type=float, default=0.5, help='Time to wait between actions in seconds')
    automation_parser.add_argument('--use-wallet', type=str, default='false', help='Enable Solana wallet integration for automation (true/false)')
    automation_parser.add_argument('--wallet-public-key', type=str, help='Public key of the wallet to inject into the browser')
    automation_parser.add_argument('--wallet-secret-env', type=str, help='Environment variable containing the wallet secret key (base58)')
    automation_parser.add_argument('--wallet-secret-key', type=str, help='Base58-encoded wallet secret key (fallback if env var not provided)')
    automation_parser.add_argument('--upload-directory', type=str, help='Path to a folder whose files should be available for browser uploads')

    # Browser opener command
    browser_parser = subparsers.add_parser('browser', help='Open a browser')
    browser_parser.add_argument('--url', type=str, default="https://www.google.com", help='The URL to open')
    browser_parser.add_argument('--headless', action='store_true', help='Run in headless mode')
    browser_parser.add_argument('--browser-path', type=str, help='Path to browser executable (for system browser)')
    browser_parser.add_argument('--profile', type=str, default='default_profile', help='Browser profile name to use')

    # Profile management command
    profile_parser = subparsers.add_parser('profiles', help='Manage browser profiles')
    profile_parser.add_argument('--list', action='store_true', help='List all available profiles')
    profile_parser.add_argument('--create', type=str, help='Create a new browser profile')
    profile_parser.add_argument('--delete', type=str, help='Delete an existing browser profile')
    profile_parser.add_argument('--delete-all', dest='delete_all', action='store_true', help='Delete all browser profiles')
    profile_parser.add_argument('--browser-path', type=str, help='Path to browser executable (for browser-specific profiles)')

    # Chromium management command
    chromium_parser = subparsers.add_parser('chromium', help='Manage Chromium browser')
    chromium_parser.add_argument('--status', action='store_true', help='Check Chromium installation status')
    chromium_parser.add_argument('--install', action='store_true', help='Install Chromium browser')
    chromium_parser.add_argument('--uninstall', action='store_true', help='Uninstall Chromium browser')

    # Wallet management command
    wallet_parser = subparsers.add_parser('wallet', help='Manage Solana wallets')
    wallet_parser.add_argument('--generate', type=str, metavar='NAME', help='Generate a new wallet with the given name')
    wallet_parser.add_argument('--balance', type=str, metavar='PUBLIC_KEY', help='Check balance of a wallet by public key')
    wallet_parser.add_argument('--rpc-url', type=str, default='https://api.mainnet-beta.solana.com', help='Solana RPC URL')

    return parser


def parse_args() -> argparse.Namespace:
    parser = create_main_parser()
    return parser.parse_args()


__all__ = ["create_main_parser", "parse_args"]
