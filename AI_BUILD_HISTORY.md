# FINN AI Build History

This repository was built primarily in Antigravity, then reviewed and submission-prepared in Codex/ChatGPT against the ENAM FINN build challenge.

## Build record

- Reviewed the ENAM challenge brief and the companion announcement/financial glossary.
- Implemented the mobile-first Push and Pull workflows with a primary-source-only research boundary.
- Added cryptographic PDF provenance checks, verbatim quote validation, formula checks, and regression tests.
- Added Evidence Health telemetry so reviewers can inspect coverage, freshness, citations, formulas, and blockers in-app.
- Added the News Cockpit: browser-native audio navigation, saved stories, sharing/copying, and a morning-brief export.
- Fixed speech-transition races so stale browser speech callbacks cannot hide the active Stop control.
- Codex/ChatGPT performed the independent review, fixed the audio transition race, prepared the submission documents, and verified the final state with 15 passing backend tests, provenance verification, frontend lint, and a production build.

## Conversation links

The ENAM brief asks for the coding-agent and LLM build history. Antigravity contains the main implementation history; Codex/ChatGPT contains the review, fixes, and submission preparation. The Codex thread has a public share link. Antigravity currently exposes this conversation only through its local app URL, so the exact conversation title and local identifier are recorded below rather than inventing a public URL.

- **Codex / ChatGPT build conversation:** https://chatgpt.com/s/cx_6af97fc88cc081919b6098da68974588
- **Antigravity build conversation:** `Evidence Health Panel Implementation` — local conversation URL: https://127.0.0.1:57598/c/88c45bc3-224d-4c79-89e7-e5f2536c1c3d?project=outside-of-project

### Exported Antigravity transcript

- Human-readable full transcript: [`AI_CHAT_TRANSCRIPT.md`](AI_CHAT_TRANSCRIPT.md) — 146 logged steps.
- Machine-readable session log: [`AI_CHAT_TRANSCRIPT.jsonl`](AI_CHAT_TRANSCRIPT.jsonl) — 146 valid JSONL records.

### Antigravity export note

The Antigravity UI provides rename/pin/archive/split/copy actions but no public share/export action for this conversation. Before sending the email, open the conversation in Antigravity and use its available Copy/export workflow if the app exposes one in your environment; replace the local URL above with that public export link. The build record itself is preserved in this repository so the history is still reviewable.

