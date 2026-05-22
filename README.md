# ἔθος · ethos

> *"We are what we repeatedly do."* - Aristotle

A terminal-aesthetic life tracker built around a single idea: the daily disciplines that shape who you are.

**[→ Live Demo](https://ethos-jet.vercel.app)**

---

## TL;DR

Open-source life tracker. Terminal aesthetic. Greek philosophy naming. No npm or complex build step required - just open `index.html` and go. Securely sync your records across sessions in the cloud using dynamic developer handle authentication. Track your daily disciplines across life domains ([math], [body], [mind], [build]), earn XP, keep streaks, and build character.

---

## What is ethos?

**ethos** is a zero-dependency, cloud-synchronized life tracking system. It is designed to be completely frictionless - log in with your secure, private cloud profile using a dynamic developer handle to keep your data in sync across all your devices.

The name comes from the ancient Greek **ἔθος** (éthos) - meaning *custom, practice, character*. The traceable units in this app are called **ἤθη** (ethe, plural) - not "habits", not "tasks", but the disciplines you choose to embody.

---

## Features

- **ἤθη tracker** - add, complete, and streak your daily disciplines
- **Group system** - organize ethe into life domains: `[math]` `[body]` `[mind]` `[build]`
- **XP + streak system** - 7 LLM-themed progression levels (Tokenizer -> Architect)
- **Oracle LLM Companion** - ask math or deep learning questions in your CRT terminal using Google's ultra-fast `gemini-2.5-flash` model
- **Natural Language Habit Control** - tell the Oracle what you completed or undid (e.g. `oracle I practiced linear algebra today`), and it automatically toggles ethe, recalculates XP, and saves state
- **Retro loader animations** - cycling spinners and neural parameter sync frames while connecting to generative AI cores
- **Reminders & Alarms Engine** - schedule audio routine notifications (`remind HH:MM [label]`) with custom synthesized retro frequencies
- **Full PWA support** - installable standalone app, offline service-worker caching, and notification triggers
- **Contribution heatmap** - GitHub-style activity grid
- **Secure Session Authorization** - log in dynamically using raw custom developer usernames (e.g. `@meletus`) or standard emails
- **Cloud Synchronization** - real-time database sync to back up your records automatically
- **Skill score bars** - track granular sub-skills inside groups (e.g. linear algebra, attention, LoRA under `[math]`)
- **Paper log** - log research papers or books you're working through
- **Session notes** - timestamped journal entries per session
- **Activity log** - real-time terminal output of everything you do
- **Boot sequence** - because it matters

---

## Design philosophy

| Principle | What it means |
|---|---|
| **One file** | The whole app runs as a lightweight static client with zero build setup |
| **Cloud Sync** | Secure cloud-synchronized architecture backed by Firebase |
| **No lock-in** | Fork it, customize it, style it, make it yours |
| **Zero dependencies** | No npm, no bundler, no build step. Open and use. |

This is built for self-directed learners, indie hackers, and anyone running a personal curriculum outside of institutional structures.

---

## Stack

```
HTML · CSS · Vanilla JS
Firebase Realtime Database for state
JetBrains Mono (Google Fonts CDN - only external dependency)
Hosted on Vercel
```

---

## Getting started

```bash
git clone https://github.com/LaRoyBot/ethos.git
cd ethos
# open index.html in any browser - that's it
```

Or just visit **[ethos-jet.vercel.app](https://ethos-jet.vercel.app)** directly.

---

## Project structure

```
ethos/
├── index.html      # App shell + markup
├── app.js          # Core logic, state, event handlers
├── data.js         # Default data, group definitions, XP tables
└── styles.css      # Terminal aesthetic, scanlines, animations
```

---

## Roadmap

- [ ] Export/import state as JSON
- [x] PWA support (installable, offline manifest, reminders, background notifications)
- [ ] Group-level analytics view
- [x] Secure Firebase Cloud Sync with dynamic developer handles
- [x] CLI companion (`ethos`, `remind`, and `oracle` commands to log ethe/reminders/AI)
- [x] Natural Language Habit Control via client-side Gemini LLM integrations

---

## Contributing

Issues and PRs welcome. If you fork it and make something interesting, let me know - I'd love to see it.

If you have a group idea, an ethos suggestion, or a UI improvement, open an issue.

---

## License

MIT - do whatever you want with it.

---

*Built by [@LaRoyBot](https://github.com/LaRoyBot) as part of a self-directed math-to-LLM curriculum. The tracker started as a way to stay accountable to the curriculum. Then it became the thing.*
