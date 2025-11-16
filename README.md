# Vector AI Agent — Desktop Browser & Automation Agent

Vector AI Agent is a desktop browsing application that blends a full-featured web browser with a built-in automation assistant. It provides a practical environment to browse, automate tasks using natural language prompts, and manage multiple browser profiles and wallets — all in one self-contained desktop app.

---

## What is Vector AI Agent? 💡

Vector AI Agent is designed to make routine web tasks easier by combining a normal browsing experience with an automation-first interface. Users can manually browse, store bookmarks, and manage tabs — and switch to the assistant to instruct the application in natural language to run automation tasks. Automation tasks run in isolated browser profiles, keeping the UI and the automated content separate for safety and clarity.

---

## Key Features ✨

- Natural language automation: Use the built-in prompt panel to describe the task you want the browser to perform.
- Profile-based automation: Create and manage multiple browser profiles with isolated browsing state (cookies, storage, history), then target specific profiles for automation tasks.
- Automation task management: Start, stop, and monitor automation tasks with console-style logs and task result summaries.
- Prompt history & saved prompts: Reuse previous prompts or save common prompts as templates for repeatable workflows.
- Wallet manager: Create wallets, view balances, set the active wallet, and use wallets as part of automation tasks.
- Profile management: Create, open, delete, and bulk-manage profiles to run tasks across different browser states.
- Settings & preferences: Control startup behavior (default URL), UI theme, and selected profile behavior.
- Local storage & privacy: User data and settings are stored locally and persist between sessions; the application is privacy-minded and offers options to limit telemetry and external sync.
- Isolation & safety: Automation runs in isolated webviews so the main UI remains responsive and secure while automation is performed separately.
- Scheduling & multi-profile workflows: Build workflows and schedule or orchestrate them across several profiles.

---

## Quick Start — Running the App ▶️

1. Install dependencies and start the development version:

```bash
npm install
npm run dev
```

2. To create a production build and package the application:

```bash
npm run build
# Depending on your platform you can run specific packaging scripts
# e.g., "npm run dist:win" for a Windows build
```

Note: When building a distributable, the project includes an optional companion step for a command-line automation runtime; this is invoked from the build script if desired.

---

## How to Use — UI Overview 🧭

- Address Bar & Tabs — Use the address bar to browse and manage tabs. Bookmarks and quick navigation let you keep favorite pages readily available.
- Assistant Panel — Click the assistant icon to open the automation prompt. Enter a natural-language instruction (e.g., "Search for the best wireless headphones and add them to the comparison list") and run it against the selected profile.
- Automation Console — The automation area shows per-profile logs, status indicators (running, ready), and task result messages; you can stop a running task at any time.
- Prompt Sidebar — Access prompt history and saved prompts from the right-side panel. Selecting a prompt auto-fills the assistant, ready to run.
- Wallet Management — Generate a new wallet, change the active wallet, refresh balances, copy public keys, and delete wallets. Wallets can be attached to automation tasks when needed.
- Profile Management — Create, open, and delete browser profiles. Use different profiles to maintain separate cookies and session states for testing and automation.
- Settings — Configure startup preferences, default site, and other UI-level options in the Settings panel.

---

## Automation: Concepts & Workflow ⚙️

- Profiles: Each automation task executes in an isolated profile to avoid shared state. Profiles let you run parallel workflows without interference.
- Prompts: Automation tasks are initiated using plain text prompts. Prompts are recorded in history; frequently used prompts can be saved for quick reuse.
- Task Execution: When you start an automation task, the app shows console-style logs and a final success/error summary. Tasks may optionally use attached wallets or read from a configured file upload directory for inputs.
- Runtime Options: Options such as attaching wallets or designating an upload directory are configurable for a task at runtime.
- External Integration: For advanced use, the app exposes runtime hooks and endpoints that let external processes or scripts interact with the browser (for example, to start a task, stream logs, or query status). These integrations are optional — the UI itself covers most use cases.

---

## Developer Guide & Building 🛠️

1. Install dependencies: `npm install`.
2. Development: `npm run dev` — launches the app locally in development mode.
3. Build: `npm run build` — creates a production-ready bundle.
4. Packaging: The repository includes platform build steps which produce distributable packages for OS targets.

If you plan to contribute, follow these basic steps:

1. Fork and create a feature branch.
2. Add changes and tests where needed.
3. Keep the UI design consistent with the project's existing visual style.
4. Open a PR and reference any new behavior clearly in the description.

Contributions are appreciated — check `CONTRIBUTING.md` for more details.

---

## Privacy & Security 🔒

- Local-first: Preferences, prompts, profiles, and wallets are kept locally by default and persist between sessions.
- Opt-in integrations: The app supports optional external automation clients or tooling; these are integrations you explicitly configure or enable.
- Data storage: Wallet private information is stored securely and should be backed up by the user — never share private keys.

---

## Troubleshooting & Tips ⚠️

- If automation tasks fail to start, confirm that a profile is selected, and that any runtime options (like wallet attachment or file directories) are configured.
- When using an external automation client or script, double-check that the automation endpoint and debug port shown in the UI are reachable.
- If a profile-based task is not behaving consistently, try running it in a fresh profile to isolate session-dependent state.

---

## Contributing & Support 🤝

If you’d like to contribute, please read `CONTRIBUTING.md` and open a pull request with your proposed changes. For project documentation, architecture overview, and deeper implementation details, check the `docs/` directory if present.

---

Thank you for checking out Vector AI Agent — we hope this tool simplifies repeated browsing workflows and brings the power of automation to your desktop in a safe, easy-to-use package!
