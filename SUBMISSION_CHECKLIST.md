# FINN Submission Checklist

## Required deliverables

- [x] Mobile-first responsive web prototype
- [x] GitHub repository
- [x] Short covering write-up
- [x] Public Codex/ChatGPT build-conversation link
- [ ] Public Antigravity build-conversation link (Antigravity currently exposes only a local conversation URL; export/share it if available)
- [ ] Candidate name and contact details
- [ ] Permanent public demo URL (the current Cloudflare URL is temporary)

## Repository

https://github.com/AlgoRubic/ENAM-ASSIGNMENT

## AI build history

- Codex / ChatGPT: https://chatgpt.com/s/cx_6af97fc88cc081919b6098da68974588
- Antigravity: `Evidence Health Panel Implementation` — https://127.0.0.1:57598/c/88c45bc3-224d-4c79-89e7-e5f2536c1c3d?project=outside-of-project

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

