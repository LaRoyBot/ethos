# ἔθος · ethos

> *"We are what we repeatedly do. Excellence, then, is not an act, but a habit."* — Aristotle, *Nicomachean Ethics*

**ethos** is an ultra-lightweight, zero-dependency, terminal-aesthetic personal discipline compiler and life-curriculum tracker. It is engineered for developers, mathematicians, and self-directed researchers who demand extreme execution accountability without bloated frameworks, tracking cookies, or heavy database clients.

**[→ Launch Interactive Terminal](https://ethos-jet.vercel.app)**

---

## 🛠️ The Technical Spec

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

*   **Runtime:** Pure 100% Vanilla ES5/ES6 JavaScript (zero-dependency app core).
*   **Aesthetics:** High-refresh retro CRT simulation, scanline layer blending, neural boot sequences, and native audio oscillator reminder presets.
*   **Database:** Decoupled dual-engine syncing (Vercel KV serverless Redis + Firebase Realtime Database fallbacks).
*   **Security:** Cryptographically authenticated transactions via dynamic client-side Firebase Auth JSON Web Tokens (JWTs) bypassed through a same-origin reverse-proxy gateway.
*   **Offline Capability:** Complete Progressive Web App (PWA) manifest with service-worker network-first caching, local backups, and offline notification scheduling.

---

## ⚡ Sync Gateway Architecture (Our Pride & Joy)

Under the hood, **ethos** implements a state-of-the-art serverless synchronization pipeline that achieves secure, real-time database state replication with **zero external node dependencies** on the client.

### 1. Dynamic JWT Token Authentication
Rather than using static, leak-prone API tokens or manual 40-character sync keys, `ethos` binds securely to your Firebase Auth session. 
* On every sync payload write (`PUT`) or fetch (`GET`), the app extracts your short-lived Firebase `IdToken` (JWT) directly from `firebase.auth().currentUser`.
* This token is transmitted in the request headers (`Authorization: Bearer <token>`) to Vercel.
* The Serverless Gateway `/api/sync.js` extracts and validates the JWT cryptographically, ensuring absolute multi-tenant database isolation.

### 2. Zero-Dependency Serverless Proxy
Instead of pulling massive, CPU-hogging client libraries, the client speaks native, lightweight `fetch()` directly to the same-origin `/api/sync` gateway. The Vercel function translates standard REST calls into high-performance Upstash Redis TCP instructions, keeping bundle sizes strictly minimal.

### 3. Defensive Sync Safeguards (Bulletproof Execution)
*   **Pre-Replace Local Snapshotting:** Before any cloud state pull is applied to the local memory, the app automatically takes a full local backup and commits it to `localStorage` under `mathInit_state_backup_YYYY-MM-DD-HH-MM-SS-MS`. If a cloud state was corrupted or stale, you are exactly one command away from an instant local restore.
*   **Vector Clock Versioning & Pull Refusal:** The sync engine maintains an incremental `pushCount` alongside the `lastUpdated` timestamp. If a forced cloud pull is initiated, the engine verifies the payload size and version vector. **If the remote state is smaller and older than your local state, the engine actively refuses the pull to safeguard your hard-earned local data.**
*   **Active WebSocket Detachment:** Running WebSockets in the background drains mobile batteries and triggers console connection alerts when Firebase is blocked. The moment `ethos` detects your same-origin gateway key is configured, it **instantly detaches the Firebase Realtime WebSocket listener** to clean up socket allocations, dynamically re-binding only if you choose to revert to Firebase.

---

## ⌨️ CRT Terminal CLI Command Spec

Type `help` inside your `ethos` console to interact with the system via its native terminal engine.

*   `auth proxy gateway` — Restructure your connection settings to bypass direct database blocks and sync quietly through your dynamic Firebase-token same-origin gateway.
*   `auth status` — Fetch full telemetry on current database alignments, active paths, and state packet diagnostics.
*   `auth push` / `auth pull` — Run full manual vector-clock sync updates. Prints a gorgeous, granular summary of all Streaks, XP values, completed habits, and routines directly in the terminal interface.
*   `remind [HH:MM] [Message]` — Add audio routine notifications using custom synthesized retro frequencies generated offline via standard browser AudioContext oscillators.
*   `oracle [NL Query]` — Converse directly with Google's ultra-fast `gemini-2.5-flash` generative AI model.
*   **Natural Language Habit Control:** Try talking to the oracle like a human:
    `$ oracle I crushed my linear algebra and body exercises today`
    The Oracle parses your request, cross-checks your daily disciplines, automatically toggles the correct ethe, updates streaks, grants XP, and commits a quiet state sync!

---

## 🏛️ Aristotle's Core Philosophy

In Aristotle's philosophy, **ἤθη** (ethe, plural of *ethos*) are not mechanical "habits" you perform blindly. They are the deliberate customs and practices you choose to embody to forge your character. 

The tracker is organized into explicit life domains:
*   `[math]` — Foundations of the future. Track Linear Algebra, Probability, Attention Mechanics, and LoRA parameters.
*   `[body]` — The physical vessel. Manage routines, sleep, hydration, and active rehabilitation.
*   `[mind]` — Focus, contemplation, and literature. Log books, research papers, and self-reflections.
*   `[build]` — Compiling ideas into production systems.

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

*Built by [@LaRoyBot](https://github.com/LaRoyBot) as part of a self-directed math-to-LLM curriculum. The tracker started as a way to stay accountability to the curriculum. Then it became the thing.*
