

# Vector AI Agent — Desktop Browser & Automation Agent - Chrome/Edge 
<img width="1536" height="1024" alt="20251116_2156_4K Promo Vector_remix_01ka6qqae7fea96rdm6kg99q3t (1)" src="https://github.com/user-attachments/assets/322a27fa-f210-4965-9bd2-d17e5e2fbdd7" />


Vector AI Agent is a desktop browsing application that blends a full-featured web browser with a built-in automation assistant. It provides a practical environment to browse, automate tasks using natural language prompts, and manage multiple browser profiles and wallets — all in one self-contained desktop app.

---

## What is Vector AI Agent? 💡

Vector AI Agent is designed to make routine web tasks easier by combining a normal browsing experience with an automation-first interface. Users can manually browse, store bookmarks, and manage tabs — and switch to the assistant to instruct the application in natural language to run automation tasks. Automation tasks run in isolated browser profiles, keeping the UI and the automated content separate for safety and clarity.

---

## 🔥 Key Features

# 1. AI Browser Automation

Automate any website with natural language:

Click buttons

Fill forms

Scroll

Navigate pages

Upload/download files
The AI controls the browser like a real user.

# 🔄 2. Multi-Profile Parallel Execution

Run multiple browser profiles side-by-side:

Separate cookies

Separate sessions

Separate wallets

Separate automation tasks
Perfect for: farming, multi-account ops, token launches, data tasks.

# 🔐 3. Vector Wallet Integration

A built-in Phantom-style Solana wallet:

Create/import wallets

Auto-login

Auto-sign transactions

Link wallets to profiles

Full dApp interaction (pump.fun, bonk.fun, Raydium, etc.)

# ⚙️ 4. Natural Language Task Commands

Just type what you want:

“Open pump.fun and launch a token.”

“Buy 1 SOL of this token with profile 3.”

“Open Twitter and search #SOL.”
AI executes the entire workflow automatically.

# 🔗 5. Wallet–Profile Assignment

Assign different wallets to different profiles for:

Multi-wallet buys

Multi-profile token launching

Safe isolated testing

Degen bot setups

# 🤖 6. AI Task Orchestration

The agent understands multi-step flows:

Open site → interact → confirm → continue

Handles navigation, buttons, text, dropdowns

Auto-repeats steps if UI changes

Self-corrects when confused

# 🧩 7. Prompts & Templates

Save frequently used commands:

Buy templates

Launch templates

Web automation templates
Quick access to common automations.

# 🧠 8. AI Vision Element Detection

(Works through DOM + visual understanding)

Detects buttons, fields, menu items

Handles dynamic or moving UI

Works on complex sites (pump.fun, RaydiumCharts, booking sites)

# ⚡ 9. Auto-Retry + Error Handling

If something fails:

AI retries

Adapts to UI changes

Corrects flow

Continues automation instead of stopping

# ⏱️ 10. Task Scheduler (Optional Add-on)

Run tasks at:

Specific times

Intervals (every X minutes/hours)

On repeat loops
Useful for data checks, token monitoring, recurring tasks.

# 🛡️ 11. Local-First Privacy

No cloud

No external storage

Wallets stored locally

Browser profiles local
Your data never leaves your system.

# 🌐 12. Works With Any Website

Supports automation on:

pump.fun

bonk.fun

Jupiter

Raydium

Twitter

Booking portals

Ticket portals

E-commerce

Any normal website

# 📡 13. API Integration Support

Users can plug in:

Crypto price APIs

News APIs

RPC nodes

Trading APIs

Custom REST endpoints

Or you can use a developer API key for onboarding.

# 🔉 14. Voice-Controlled Automation (upcoming)

Control tasks by simply speaking:

“Open all profiles.”

“Launch token.”

“Buy 0.5 SOL.”

# 🔗 15. Agent-to-Agent Collaboration (upcoming)

One agent can gather data → another agent takes action.

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
