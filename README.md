# ἔθος · ethos

> *"We are what we repeatedly do."* — Aristotle

A terminal-aesthetic life tracker built around a single idea: the daily disciplines that shape who you are.

**[→ Live Demo](https://ethos-jet.vercel.app)**

---

## TL;DR

Open-source life tracker. Terminal aesthetic. Greek philosophy naming. No npm or complex build step required — just open `index.html` and go. Own your data locally or securely sync across sessions using dynamic developer handle authentication. Track your daily disciplines across life domains ([math], [body], [mind], [build]), earn XP, keep streaks, and build character.

---

## What is ethos?

**ethos** is a zero-dependency, offline-first life tracking system with optional secure cloud synchronization. It is designed to be completely frictionless—you can run it locally with zero setup, or link it to a secure, private cloud profile to keep your data in sync across all your devices.

The name comes from the ancient Greek **ἔθος** (éthos) — meaning *custom, practice, character*. The traceable units in this app are called **ἤθη** (ethe, plural) — not "habits", not "tasks", but the disciplines you choose to embody.

---

## Features

- **ἤθη tracker** — add, complete, and streak your daily disciplines
- **Group system** — organize ethe into life domains: `[math]` `[body]` `[mind]` `[build]`
- **XP + streak system** — 7 LLM-themed progression levels (Tokenizer → Architect)
- **Contribution heatmap** — GitHub-style activity grid
- **Secure Session Authorization** — log in dynamically using raw custom developer usernames (e.g. `@meletus`) or standard emails
- **Cloud Synchronization** — optional real-time database sync to back up your records automatically
- **Skill score bars** — track granular sub-skills inside groups (e.g. linear algebra, attention, LoRA under `[math]`)
- **Paper log** — log research papers or books you're working through
- **Session notes** — timestamped journal entries per session
- **Activity log** — real-time terminal output of everything you do
- **Boot sequence** — because it matters

---

## Design philosophy

| Principle | What it means |
|---|---|
| **One file** | The whole app can be a single HTML file you email to yourself |
| **Own your data** | Local-first design using `localStorage`, with optional, secure Firebase Cloud Sync |
| **No lock-in** | Fork it, self-host it, strip it down, make it yours |
| **Zero dependencies** | No npm, no bundler, no build step. Open and use. |

This is built for self-directed learners, indie hackers, and anyone running a personal curriculum outside of institutional structures. A file you can open on a flight is a feature.

---

## Stack

```
HTML · CSS · Vanilla JS
localStorage for state
JetBrains Mono (Google Fonts CDN — only external dependency)
Hosted on Vercel
```

---

## Getting started

```bash
git clone https://github.com/LaRoyBot/ethos.git
cd ethos
# open index.html in any browser — that's it
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
- [ ] PWA support (installable, offline manifest)
- [ ] Group-level analytics view
- [x] Secure Firebase Cloud Sync with dynamic developer handles
- [ ] CLI companion (`ethos` command to mark ethe from terminal)

---

## Contributing

Issues and PRs welcome. If you fork it and make something interesting, let me know — I'd love to see it.

If you have a group idea, an ethos suggestion, or a UI improvement, open an issue.

---

## License

MIT — do whatever you want with it.

---

*Built by [@LaRoyBot](https://github.com/LaRoyBot) as part of a self-directed math-to-LLM curriculum. The tracker started as a way to stay accountable to the curriculum. Then it became the thing.*
