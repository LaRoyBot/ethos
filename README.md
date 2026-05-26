# ἔθος · ethos

> *"We are what we repeatedly do. Excellence, then, is not an act, but a habit."* — Aristotle, *Nicomachean Ethics*

**ethos** is an open-source, zero-dependency, terminal-aesthetic life tracker built around a single idea: tracking the daily disciplines (ἤθη, *ethe*) that build character. 

It is designed for developers, researchers, and self-directed learners who want a lightweight, distraction-free CRT terminal interface to track their daily routines, log research papers, earn XP, and sync records seamlessly in the cloud.

**[→ Launch Live App](https://ethos-jet.vercel.app)**

---

## 🛠️ Tech Stack & Philosophy

*   **Frontend:** Pure HTML5, CSS3 (retro scanline shading, visual coherence waves), and Vanilla ES5/ES6 JavaScript. No npm packages, no bundler, no build steps. 
*   **Database:** Decoupled dual-engine syncing (Vercel KV serverless Redis + Firebase Realtime Database direct connection fallback).
*   **Fonts:** JetBrains Mono (via Google Fonts CDN).
*   **Hosting:** Vercel serverless.

---

## ⚡ Sync & Auth Architecture (Under the Hood)

ethos implements a highly robust, secure, and lightweight same-origin synchronization pipeline designed to maintain zero-dependency client performance while ensuring absolute multi-tenant database isolation.

```
      +---------------------------------------------------------+
      |                      ethos PWA                          |
      |   (Vanilla JS Engine / CRT Terminal CLI / CSS Scanlines) |
      +----------------------------+----------------------------+
                                   |
                     [Dynamic Firebase IdToken]
                                   |
                                   v
      +---------------------------------------------------------+
      |                 Vercel Same-Origin API                  |
      |          (/api/sync Node.js Serverless Gateway)         |
      +----------------------------+----------------------------+
                                   |
                       [Secure HTTPS JSON Payload]
                                   |
                                   v
      +---------------------------------------------------------+
      |                   Vercel KV Cloud                       |
      |           (Upstash Redis Serverless Cluster)            |
      +---------------------------------------------------------+
```

### 1. Dynamic Firebase IdToken Authentication
Instead of using leak-prone API tokens or manual 40-character sync keys, `ethos` integrates directly with active Firebase Auth sessions.
* On every sync write (`PUT`) or fetch (`GET`), the app extracts the short-lived Firebase `IdToken` (JWT) dynamically in real-time from `firebase.auth().currentUser`.
* This token is transmitted in the request headers (`Authorization: Bearer <token>`) to the server.
* The Serverless Gateway `/api/sync.js` validates the token cryptographically on Vercel's end before communicating with the database.

### 2. Zero-Dependency Serverless Proxy
Instead of loading a heavy database SDK on the client, the app uses native `fetch()` calls to the same-origin `/api/sync` path. The serverless Vercel function translates these calls into TCP instructions for the serverless Upstash Redis database (Vercel KV), keeping the frontend bundle ultra-fast.

### 3. Defensive Sync Safeguards
*   **Pre-Replace Local Backups:** Before any cloud state overwrite is applied to local memory, the app automatically takes a full snapshot of the current state and saves it in `localStorage` under `mathInit_state_backup_YYYY-MM-DD-HH-MM-SS-MS`. This acts as an instant local restore point.
*   **Vector Clock Versioning & Pull Refusal:** The sync engine tracks incremental `pushCount` alongside the `lastUpdated` timestamp. If a forced cloud pull is triggered, the engine verifies the payload size and version vector. **If the remote state looks older or smaller than the local state, the engine actively refuses the pull to protect local data.**
*   **Dynamic WebSocket Detachment:** Running real-time WebSockets drains battery and throws connection errors in the console when Firebase is blocked. The moment a same-origin gateway becomes active, `ethos` **automatically detaches the background Firebase WebSocket listener** to clean up memory and sockets, dynamically re-binding only if default Firebase is restored.

---

## 🧠 ECRE (Ethos Cognitive Reflection Engine)

`ethos` goes beyond a standard passive tracker by introducing **ECRE**—a reflective memory profile system that uses Google's `gemini-2.5-flash` model to analyze scheduling failures and enforce cognitive accountability.

*   **Reflective Coherence Diagnostics (Radar Card):** Clicking the **ECRE Radar Card** launches a coherence diagnostic modal, compiling CNS vector compliance percentages to measure behavioral consistency.
*   **XP-Lock Questions:** ECRE tracks active commitments (promises) and generates context-aware, deep questions about cognitive barriers (e.g. *"What specific cognitive friction prevents the initiation of the proof derivation protocol?"*). These questions **actively lock down session XP gains** until a reflective response is typed directly into the CRT terminal to clear the lock.
*   **Reflective Command Routing:** Any unrecognized terminal input is automatically routed as a reflection prompt to ECRE. Powered by Gemini, ECRE returns a detailed, structured **ECRE Cognitive Appraisal** directly in the terminal log.
*   **Temporal Rewind Telemetry (`auth rewind`):** Replays historical database snapshots chronologically, displaying coherence compliance states step-by-step.

---

## ⌨️ CRT Terminal CLI Command Spec

Type `help` inside the `ethos` terminal to see available actions.

*   `auth proxy gateway` — Switch connection settings to sync quietly through the dynamic Firebase-token same-origin gateway.
*   `auth status` — Fetch full telemetry on current database alignments, active paths, and state packet diagnostics.
*   `auth push` / `auth pull` — Run manual sync updates. Prints a detailed summary of all Streaks, XP values, completed habits, and routines (names, timestamps, and sizes) directly in the terminal interface.
*   `auth rewind` — Initiate a temporal rewind replay of history states and ECRE compliance metrics.
*   `remind [HH:MM] [Message]` — Schedule routine notifications using custom synthesized retro frequencies generated offline via browser AudioContext oscillators.
*   `oracle [NL Query]` — Converse directly with Google's `gemini-2.5-flash` AI model.
*   **Natural Language Habit Control:** Tell the Oracle what was completed in plain English:
    `$ oracle I completed my linear algebra routine and did body exercises today`
    The Oracle parses the request, toggles the correct ethe, updates streaks, grants XP, and commits a quiet state sync automatically.

---

## 🚀 Getting Started (No Bundler, No Setup)

Clone the repo, open `index.html` in any browser, and you are fully up and running.

```bash
git clone https://github.com/LaRoyBot/ethos.git
cd ethos
# Double-click index.html or host it locally. Zero build steps.
```

To deploy on Vercel:
```bash
npm install -g vercel
vercel
```

---

*Built by [@LaRoyBot](https://github.com/LaRoyBot) as part of a self-directed math-to-LLM curriculum. The tracker started as a way to stay accountable to the curriculum. Then it became the thing.*
