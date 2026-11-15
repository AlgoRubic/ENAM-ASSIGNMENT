# FINN Submission Checklist

## Required deliverables

- [x] Mobile-first responsive web prototype
- [x] GitHub repository
- [x] Short covering write-up
- [x] Public Codex/ChatGPT build-conversation link
- [ ] Public Antigravity build-conversation link (Antigravity currently exposes only a local conversation URL)
- [x] Exported Antigravity transcript included (`AI_CHAT_TRANSCRIPT.md` and `AI_CHAT_TRANSCRIPT.jsonl`)
- [ ] Candidate name and contact details
- [x] Public production frontend URL: https://finn-investment-agent.beigetoad12.chatgpt.site
- [ ] Permanent backend hosting (the current API bridge uses a Cloudflare tunnel and must remain running)

## Repository

https://github.com/AlgoRubic/ENAM-ASSIGNMENT

## AI build history

- Codex / ChatGPT: https://chatgpt.com/s/cx_6af97fc88cc081919b6098da68974588
- Antigravity: `Evidence Health Panel Implementation` — https://127.0.0.1:57598/c/88c45bc3-224d-4c79-89e7-e5f2536c1c3d?project=outside-of-project
- Full Antigravity transcript: `AI_CHAT_TRANSCRIPT.md` (human-readable) and `AI_CHAT_TRANSCRIPT.jsonl` (raw log)

## Live production frontend

https://finn-investment-agent.beigetoad12.chatgpt.site

The frontend is published on Sites hosting. It currently calls the FastAPI backend through this live API bridge:

https://apart-customers-green-entertainment.trycloudflare.com/api

Keep the local FastAPI process and Cloudflare API tunnel running until the backend is moved to a permanent API host.

## Current phone-test demo

https://folder-sql-coral-certain.trycloudflare.com

This is a temporary quick-tunnel URL. Keep the local backend, frontend preview, and tunnels running while using it. Replace it with a permanent deployment URL before emailing the submission if possible.

## Final verification commands

```powershell
.\venv\Scripts\python backend/verify_provenance.py
.\venv\Scripts\pytest -q
cd frontend
npm run lint
npm run build
```

## Email destination

assessment@enam.com

## Email subject

IIT Delhi – AI Engineer - 2027

