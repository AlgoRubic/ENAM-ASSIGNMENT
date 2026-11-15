# FINN Submission Checklist

## Required deliverables

- [x] Mobile-first responsive web prototype
- [x] GitHub repository
- [x] Short covering write-up
- [ ] Public AI build-history/session links
- [ ] Candidate name and contact details
- [ ] Permanent public demo URL (the current Cloudflare URL is temporary)

## Repository

https://github.com/AlgoRubic/ENAM-ASSIGNMENT

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

