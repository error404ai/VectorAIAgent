#!/usr/bin/env python
# filepath: c:\Projects\WhiskeyBA\python\src\automation\browser_automation.py
"""
Browser automation module using AI to perform tasks in a browser.
"""
import asyncio
import argparse
import sys
import json
import os
from typing import Any, Dict, Union, TypeVar, Optional
from browser_use import Agent, BrowserProfile, BrowserSession
from ..utils.user_profile import get_chrome_profile, list_chrome_profiles
from ..utils.llm import get_llm
from ..utils.chromium_manager import get_chromium_executable_path
from ..common.config import initialize_paths
from ..utils.wallet_manager import WalletManager
from ..utils.wallet_injection import WalletInjectionHelper

# Type variables for better typing
T = TypeVar('T')

class StreamToStdout:
    """
    Helper class for streaming output to stdout with an optional prefix.
    """
    def __init__(self, prefix: str = ""):
        self.prefix = prefix

    def write(self, message: str) -> None:
        if message.strip(): 
            print(f"{self.prefix}{message}", flush=True)

    def flush(self) -> None:
        sys.stdout.flush()
        

async def run_automation(
    prompt: str, 
    port: int, 
    provider: str, 
    model: str, 
    api_key: str, 
    base_url: str,
    temperature: float,
    max_tokens: int,
    browser_path: str = "",
    profile_name: str = "default_profile",
    use_vision: bool = True,
    wait_between_actions: float = 0.5,
    use_wallet: bool = False,
    wallet_public_key: str | None = None,
    wallet_secret_env: str | None = None,
    wallet_secret_key: str | None = None,
    upload_directory: str | None = None,
) -> Dict[str, Any]:
    """
    Run browser automation with the given prompt.
    
    Args:
        prompt: The automation task to perform
        port: Chrome DevTools Protocol port
        provider: The AI model provider (openai, anthropic, google, deepseek, ollama, custom)
        model: The specific model to use
        api_key: API key for the provider
        base_url: Base URL for the API (for custom providers or self-hosted models)
        temperature: Temperature parameter for the model (0.0-1.0)
        max_tokens: Maximum tokens to generate
        browser_path: Optional path to browser executable
        profile_name: Browser profile name to use
        use_vision: Whether to enable vision capabilities for image processing
    upload_directory: Optional directory whose files can be uploaded during automation
    
    Returns:
        Dictionary with result information
    """
    print(f"[START] Starting browser automation with task: {prompt}")
    print(f"[AI] Using {provider} model: {model}")
    
    # # set configuration environment variables
    # os.environ["IS_IN_EVALS"] = "true"  # Indicate we are in an evaluation context
    
    # Set API key if provided
    if api_key:
        if provider == "openai":
            os.environ["OPENAI_API_KEY"] = api_key
        elif provider == "anthropic":
            os.environ["ANTHROPIC_API_KEY"] = api_key
        elif provider == "google":            
            os.environ["GOOGLE_API_KEY"] = api_key
        elif provider == "deepseek":
            os.environ["DEEPSEEK_API_KEY"] = api_key
        elif provider == "openrouter":
            os.environ["OPENROUTER_API_KEY"] = api_key
        elif provider == "groq":
            os.environ["GROQ_API_KEY"] = api_key
        elif provider == "azure":
            os.environ["AZURE_OPENAI_API_KEY"] = api_key
        elif provider in ["aws-bedrock", "aws-anthropic"]:
            # AWS providers use AWS credentials, api_key might be used for other config
            if api_key:
                os.environ["AWS_ACCESS_KEY_ID"] = api_key
                # Note: AWS also needs AWS_SECRET_ACCESS_KEY and AWS_REGION
    
    # Create agent with direct page access using the simpler approach
    print("[CONFIG] Creating agent...")
    # Use the profile provided in parameters, fallback to default if not specified
    profile_dir = await get_chrome_profile(profile_name or "default_profile", browser_path=browser_path)
    
    print(f"[CONFIG] Using Chrome profile: {profile_name}")
    print(f"[CONFIG] Profile directory: {profile_dir}")
    
    profiles = list_chrome_profiles()
    print(f"[CONFIG] Available Chrome profiles: {profiles}")
    
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
    
    # Create the browser profile with stealth mode for anti-detection
    browser_profile = BrowserProfile(
        highlight_elements=False,
        user_data_dir=profile_dir,
        executable_path=final_browser_path,
        stealth=True,  # Enable anti-detection stealth mode
        wait_between_actions=wait_between_actions,
    )
    
    browser_session = BrowserSession(
        browser_profile=browser_profile,
    )

    wallet_helper: Optional[WalletInjectionHelper] = None
    if use_wallet:
        wallet_helper = _prepare_wallet_helper(
            browser_session,
            wallet_public_key,
            wallet_secret_env,
            wallet_secret_key,
        )
    
    available_file_paths: list[str] = []
    if upload_directory:
        normalized_directory = os.path.abspath(upload_directory)
        if os.path.isdir(normalized_directory):
            for root, _, files in os.walk(normalized_directory):
                for filename in files:
                    file_path = os.path.join(root, filename)
                    if os.path.isfile(file_path):
                        available_file_paths.append(file_path)
            print(
                f"[FILES] Prepared {len(available_file_paths)} file(s) for upload from: {normalized_directory}",
                flush=True,
            )
        else:
            print(
                f"[FILES] Upload directory does not exist or is not a directory: {upload_directory}",
                flush=True,
            )

    agent = Agent( 
        task=prompt,
        llm=get_llm(
            provider=provider,
            model=model,
            temperature=temperature,
            base_url=base_url,
            max_tokens=max_tokens,
            api_key=api_key,
            ),
        browser_session=browser_session,
        use_vision=use_vision,
        available_file_paths=available_file_paths if available_file_paths else None,
        
    )
    
    # Run the agent
    print("[AI] Running browser automation...")
    result = await agent.run(
        on_step_start=wallet_helper.on_step_start if wallet_helper else None,
    )  # type: ignore

    print("\n[RESULTS] Results:")
    print(result)  # type: ignore

    automation_done = False
    automation_success: bool | None = None
    final_summary: str | None = None
    error_messages: list[str] = []

    try:
        automation_done = result.is_done()  # type: ignore[attr-defined]
        automation_success = result.is_successful()  # type: ignore[attr-defined]
        final_summary = result.final_result()  # type: ignore[attr-defined]
        error_messages = [
            err for err in (result.errors() or []) if err  # type: ignore[attr-defined]
        ]
    except AttributeError:
        # Older versions of browser-use may not expose helper methods
        automation_success = None
        automation_done = False

    success_flag = automation_success is True

    if success_flag:
        message = "Automation task completed successfully"
    elif final_summary:
        message = final_summary
    elif automation_done:
        message = "Automation task completed without success"
    elif error_messages:
        message = error_messages[-1]
    else:
        message = "Automation task did not finish successfully"

    # Extract rich history data from the agent
    history_data: list[Dict[str, Any]] = []
    urls_visited: list[str] = []
    total_steps = 0
    total_duration_seconds = 0.0
    model_actions: list[Dict[str, Any]] = []

    try:
        # Get full history from agent
        agent_history = agent.history
        total_steps = len(agent_history.history)
        total_duration_seconds = agent_history.total_duration_seconds()
        urls_visited = agent_history.urls() if hasattr(agent_history, 'urls') else []
        
        # Serialize each step
        for step_idx, step in enumerate(agent_history.history):
            step_data: Dict[str, Any] = {
                "step_number": step_idx + 1,
                "url": step.state.url if step.state else None,
                "title": step.state.title if step.state else None,
            }
            
            # Add model output (thinking, actions)
            if step.model_output:
                step_data["thinking"] = getattr(step.model_output, 'thinking', None)
                step_data["evaluation_previous_goal"] = getattr(step.model_output, 'evaluation_previous_goal', None)
                step_data["memory"] = getattr(step.model_output, 'memory', None)
                step_data["next_goal"] = getattr(step.model_output, 'next_goal', None)
                
                # Extract actions
                if step.model_output.action:
                    step_actions = []
                    for action in step.model_output.action:
                        action_dict = action.model_dump(exclude_none=True) if hasattr(action, 'model_dump') else {}
                        step_actions.append(action_dict)
                        model_actions.append(action_dict)
                    step_data["actions"] = step_actions
            
            # Add results for each action in this step
            if step.result:
                step_results = []
                for res in step.result:
                    res_data = {
                        "is_done": res.is_done,
                        "success": res.success,
                        "extracted_content": res.extracted_content,
                        "error": res.error,
                    }
                    step_results.append(res_data)
                step_data["results"] = step_results
            
            # Add timing metadata
            if step.metadata:
                step_data["duration_seconds"] = step.metadata.duration_seconds
                step_data["step_start_time"] = step.metadata.step_start_time
                step_data["step_end_time"] = step.metadata.step_end_time
            
            # Add interacted elements
            if step.state and step.state.interacted_element:
                interacted = []
                for el in step.state.interacted_element:
                    if el:
                        interacted.append({
                            "tag_name": getattr(el, 'tag_name', None),
                            "xpath": getattr(el, 'xpath', None),
                            "text": getattr(el, 'text', None),
                        })
                if interacted:
                    step_data["interacted_elements"] = interacted
            
            history_data.append(step_data)
            
    except Exception as e:
        print(f"[WARNING] Failed to extract history data: {e}")

    final_result: Dict[str, Any] = {
        "success": success_flag,
        "message": message,
        "details": str(result),  # type: ignore
        "is_done": automation_done,
        "prompt": prompt,
        "provider": provider,
        "model": model,
        "total_steps": total_steps,
        "total_duration_seconds": total_duration_seconds,
        "urls_visited": urls_visited,
        "steps": history_data,
        "model_actions": model_actions,
    }

    if final_summary and not success_flag:
        final_result["summary"] = final_summary

    if error_messages:
        final_result["errors"] = error_messages

    print(
        "[STATUS] Automation outcome:",
        json.dumps(
            {
                "is_done": automation_done,
                "is_success": automation_success,
                "errors": error_messages,
                "total_steps": total_steps,
            }
        ),
    )
    print(f"\n[COMPLETE] Final result: {json.dumps(final_result)}")
    return final_result
            
  

def _prepare_wallet_helper(
    browser_session: BrowserSession,
    wallet_public_key: Optional[str],
    wallet_secret_env: Optional[str],
    wallet_secret_key: Optional[str],
) -> Optional[WalletInjectionHelper]:
    """Resolve wallet credentials and create injection helper."""

    public_key = (wallet_public_key or "").strip()
    secret_key = None

    if wallet_secret_env:
        secret_key = os.getenv(wallet_secret_env) or None
        if secret_key:
            secret_key = secret_key.strip()

    if not secret_key and wallet_secret_key:
        secret_key = wallet_secret_key.strip()

    if not public_key or not secret_key:
        print("[WALLET] Wallet integration requested but keys are incomplete; skipping injection")
        return None

    try:
        return WalletInjectionHelper(
            browser_session=browser_session,
            public_key=public_key,
            secret_key=secret_key,
        )
    except Exception as exc:
        print(f"[WALLET] Failed to initialize wallet injection helper: {exc}")
        return None


def main():
    """
    Main entry point for the browser automation script.
    """
    # Use centralized parsing when run as a script
    try:
        from ..cli import parse_args
        args = parse_args()
        if args.command != 'automation':
            print('[ERROR] This script should be run with the "automation" command', file=sys.stderr)
            sys.exit(1)

        # Initialize paths
        initialize_paths()
        result = asyncio.run(run_automation(
            prompt=args.prompt,
            port=args.port,
            provider=args.provider,
            model=args.model,
            api_key=args.api_key,
            base_url=args.base_url,
            temperature=args.temperature,
            max_tokens=args.max_tokens,
            browser_path=args.browser_path if hasattr(args, 'browser_path') and args.browser_path else "",
            profile_name=args.profile if hasattr(args, 'profile') and args.profile else "default_profile",
            use_vision=(args.use_vision.lower() == 'true') if hasattr(args, 'use_vision') else True,
            wait_between_actions=getattr(args, 'wait_between_actions', 0.5),
            use_wallet=(args.use_wallet.lower() == 'true') if hasattr(args, 'use_wallet') else False,
            wallet_public_key=getattr(args, 'wallet_public_key', None),
            wallet_secret_env=getattr(args, 'wallet_secret_env', None),
            wallet_secret_key=getattr(args, 'wallet_secret_key', None),
            upload_directory=getattr(args, 'upload_directory', None),
        ))
        sys.exit(0 if result["success"] else 1)
    except Exception as e:
        print(f"[ERROR] Fatal error in automation: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
