import asyncio
from typing import Optional, Set

from browser_use.browser.session import BrowserSession

from .wallet_manager import WalletManager


class WalletInjectionHelper:
    """Utility helper that injects a mock Solana provider into the active tab."""

    def __init__(self, browser_session: BrowserSession, public_key: str, secret_key: str) -> None:
        self.browser_session = browser_session
        self.public_key = public_key
        self.secret_key = secret_key
        self._provider_js = WalletManager.make_provider_script(public_key, secret_key)
        self._injected_targets: Set[str] = set()
        self._last_warning: Optional[str] = None

    async def on_step_start(self, _agent) -> None:
        """Hook compatible with Agent.run(on_step_start=...)."""
        await self.ensure_injected()

    async def ensure_injected(self) -> None:
        """Ensure the wallet provider script is present in the current tab."""
        if not self.public_key or not self.secret_key:
            return

        attempt = 0
        while attempt < 3:
            attempt += 1
            try:
                cdp_session = await self.browser_session.get_or_create_cdp_session()  # type: ignore[attr-defined]
                break
            except AssertionError:
                await asyncio.sleep(0.5)
        else:
            warning = "[WALLET] Unable to access CDP session for injection"
            if warning != self._last_warning:
                print(warning, flush=True)
                self._last_warning = warning
            return

        target_id = getattr(cdp_session, "target_id", None)
        if not target_id:
            return

        if target_id in self._injected_targets:
            return

        client = cdp_session.cdp_client
        session_id = cdp_session.session_id

        try:
            await client.send.Page.addScriptToEvaluateOnNewDocument(
                params={"source": self._provider_js},
                session_id=session_id,
            )
        except Exception as exc:  # noqa: BLE001 - we want to log and continue
            print(f"[WALLET] Failed to register provider for new documents: {exc}", flush=True)

        try:
            await client.send.Runtime.evaluate(
                params={
                    "expression": self._provider_js,
                    "awaitPromise": True,
                },
                session_id=session_id,
            )
            self._injected_targets.add(target_id)
            print(f"[WALLET] Provider injected for tab {target_id[-4:]} (total={len(self._injected_targets)})", flush=True)
        except Exception as exc:  # noqa: BLE001
            print(f"[WALLET] Provider injection failed: {exc}", flush=True)
