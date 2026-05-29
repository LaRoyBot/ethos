# Agent Guidelines for ethos (ἔθος)

Welcome, AI Agent! This repository implements **ethos** (ἔθος), an open-source, zero-dependency, retro-CRT-aesthetic terminal life tracker.

Please read and follow these guidelines when analyzing or contributing to this codebase.

---

## 🛠️ Tech Stack & Architecture Rules

1. **Zero External Dependencies:** 
   - No npm, webpack, vite, or build step. All logic resides in pure HTML5, CSS3, and Vanilla JavaScript.
   - External libraries (like Firebase SDK, JetBrains Mono font) are imported directly via CDN in `index.html`. Do not install or import modules via npm.
   - Vanilla ES6 JavaScript is preferred. Avoid using framework-specific idioms.

2. **File Structure:**
   - [index.html](file:///C:/Users/LENOVO/.gemini/antigravity/scratch/ethos/index.html): The complete single-page application markup, retro scanline styling container, and script integrations.
   - [app.js](file:///C:/Users/LENOVO/.gemini/antigravity/scratch/ethos/app.js): Core runtime logic, CLI command parser, Firebase authorization/sync handler, UI rendering engines, and ECRE integration.
   - [data.js](file:///C:/Users/LENOVO/.gemini/antigravity/scratch/ethos/data.js): Default definitions for ethe (habits), default routines, cognitive papers, weight logs, and seed structures.
   - [styles.css](file:///C:/Users/LENOVO/.gemini/antigravity/scratch/ethos/styles.css): High-aesthetic retro terminal stylesheet containing scanning animation waves, glowing elements, CRT curves, and theme presets.

---

## ⚡ Sync Protocol & Arbitration Rules

Ethos implements a robust, secure, same-origin cloud synchronization pipeline:

1. **4-Tier Priority Waterfall (`firebaseSyncPull`):**
   - **Tier 1:** Same-origin Vercel gateway `/api/sync` (node.js serverless Redis proxy).
   - **Tier 2:** User-configured custom sync proxy (via `S.customSyncProxy` and headers).
   - **Tier 3:** Firebase Realtime Database WebSockets (`firebase.database().once`).
   - **Tier 4:** Firebase Direct REST API (`firebaseDirectRestPull`) using the Dynamic Bearer JWT token.

2. **WebSocket Fallback Cache:**
   - WebSockets are monitored with a 5-second connection race timer. If they fail or time out, `_wsAvailable = false` is cached for the current session to instantly skip WebSockets on subsequent requests and directly use the high-performance REST engine.

3. **Safe Deferral of Migrations:**
   - Structural data migrations (e.g. `v2LifestyleLoaded`, `v22WaterSeeded`, `historyKeysMigrated`) must **never** run on raw module load.
   - On a new device with empty local storage, raw load runs with empty defaults. Running migrations at that stage would bump `S.lastUpdated` and trigger a premature state save, creating a newer timestamp than the cloud data.
   - **Rule:** All migrations must be deferred inside a wrapper function called from `unlockBootSync()`, ensuring they execute only **after** the cloud sync pull completes and local/cloud arbitration finishes.

4. **Arbitration Logic (`applyCloudState`):**
   - Timestamps (`lastUpdated`) and version numbers (`pushCount`) decide which state is newer.
   - **Fresh Device Overwrite Protection:** When local state has zero history/XP (fresh device bootstrap), the sync engine refuses to push local empty data and instead forces a cloud state download.
   - **Protected Local Fields:** The following keys are strictly device-local and must never be overwritten by remote cloud data:
     - `authEmail`, `authUsername`
     - `cmdHistory`
     - `customSyncProxy`, `customSyncKey`
     - `geminiKey`

---

## 🧠 ECRE (Ethos Cognitive Reflection Engine)

1. **Intelligent Diagnostics:**
   - ECRE evaluates daily routines and CNS compliance patterns, rendering reports on visual radar meters.
2. **Cognitive Accountability Locks:**
   - ECRE tracks promises and creates XP-Locks. Session XP is locked until the user responds to cognitive friction queries directly in the CRT command line.
3. **Natural Language Commands:**
   - Any unrecognized terminal commands are automatically routed through the Google Gemini endpoint to generate constructive ECRE appraisals.
   - Plain English descriptions like `oracle I finished my routine today` are parsed using AI to complete specific habits in memory and commit a sync push automatically.

---

## 🎨 Aesthetic Guidelines

- **Keep the Scanlines Alive:** Ensure all custom modals or elements fit in the glowing green, gold, amber, or amethyst color palettes and use retro styling tokens.
- **Maintain Console Responsiveness:** Print verbose, informative logging to the app's internal log list (visible via command line or status telemetry) on sync status, WebSocket connections, failures, and ECRE diagnostic processes.
