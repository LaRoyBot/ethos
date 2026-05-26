# ἔθος · ethos

> *"We are what we repeatedly do. Excellence, then, is not an act, but a habit."* — Aristotle, *Nicomachean Ethics*

**ethos** is an ultra-lightweight, zero-dependency, terminal-aesthetic **Cognitive Co-Processor and Life-Curriculum Compiler**. It is engineered for developers, AI researchers, and self-directed mathematicians who demand extreme execution accountability. 

Bypassing the passive "checkbox checklists" of traditional habit trackers, `ethos` introduces an active **Epistemic Governor** powered by Google's state-of-the-art Gemini LLM architectures.

**[→ Launch Interactive Terminal](https://ethos-jet.vercel.app)**

---

## 🧠 Core Innovation: ECRE (Ethos Cognitive Reflection Engine)

Traditional tracking tools assume humans are rational actors who simply "forgot" to do a task. `ethos` rejects this, introducing **ECRE**—an active **externalized cognitive governor** designed to combat cognitive friction, self-sabotage, and planning fallacies through deep LLM-driven behavioral alignment.

```
      +---------------------------------------------------------+
      |                      ethos PWA                          |
      |   (Vanilla JS Engine / CRT Terminal CLI / CSS Scanlines) |
      +----------------------------+----------------------------+
                                   |
                     [Freeform Interactive CLI]
                                   |
                                   v
      +---------------------------------------------------------+
      |            ECRE (Cognitive Reflection Engine)           |
      |     (Appraisal Metrics / Coherence Waveforms / Radar)   |
      +----------------------------+----------------------------+
            |                      |                      |
            v                      v                      v
      [Active Promises]     [XP-Lock Questions]    [Stale Pull Refusals]
            |                      |                      |
            +----------------------+----------------------+
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

### 1. The Reflective Coherence Diagnostic (Radar Vector Map)
ECRE compiles your habit compliance patterns into a spatial vector map. Clicking the **ECRE Radar Card** launches a high-fidelity **Reflective Coherence Diagnostic modal**, compiling compliance metrics (CNS vector coherence percentages) to dynamically gauge your behavioral velocity.

### 2. State-Locking & Epistemic Open Questions (XP-Lock)
When ECRE detects self-sabotage or broken promises, it doesn't just log it—it intervenes:
*   **XP-Lock Questions:** ECRE generates context-aware, deep epistemic questions regarding your cognitive barriers (e.g. *"What specific cognitive friction prevents the initiation of your proof derivation protocol?"*).
*   **The Governor:** These open questions actively lock down your session's XP and progress markers, forcing you to type a reflective response directly into the CRT terminal to clear the lock. It forces self-appraisal before you can continue.
*   **Active Commitments (Promises):** Tracks exact commitments made under ECRE's appraisal to measure structural accountability over time.

### 3. Unrecognized Command Freeform Reflection
The `ethos` terminal treats commands as primary functions. However, **any unrecognized text entered into the terminal is automatically treated as freeform, inline therapeutic reflection with ECRE**. Powered by Gemini, ECRE dynamically assesses your state, checks your daily disciplines, and returns a detailed **ECRE Cognitive Appraisal** report.

### 4. ECRE Telemetry Rewind (`auth rewind`)
A high-concept temporal debugger: typing `auth rewind` initiates a complete replay of your historical database snapshots. It reconstructs past days chronologically, rendering active coherence waveforms and displaying ECRE compliance vectors dynamically across your history.

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
*   `auth rewind` — Initiate a temporal rewind play of your history states and displaying ECRE compliance vectors dynamically.
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
