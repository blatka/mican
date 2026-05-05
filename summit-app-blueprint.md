# MiCAN Annual Summit Progressive Web App
## Project Blueprint

---

## Overview

A Progressive Web App (PWA) built with React for the Michigan Climate Action Network (MiCAN) Annual Summit. Attendees access the app via a URL on any device — no app store, no download, no account required. The app works on both iOS and Android, looks and feels native, and serves as a full replacement for a printed program.

**Tech Stack:**
- Frontend: React (PWA)
- Backend: WordPress REST API + JetEngine REST API
- Data: Session CPT (ACF) + Person CPT + JetEngine Sponsorships CPT + JetEngine Organizations CPT + JetEngine Sponsor Ads CPT
- Personal Schedule: Device-only browser localStorage (no login required)
- Platforms: iOS and Android (via browser / add to home screen)
- Distribution: Direct URL — email, QR code, or text message
- Hosting: Netlify (free tier) at `summit.miclimateaction.org`
- Version Control: GitHub

---

## Infrastructure

### Hosting
- **Platform:** Netlify (free tier)
- **URL:** `summit.miclimateaction.org`
- **DNS:** CNAME record in Cloudflare pointing `summit` subdomain to Netlify
- **Deploys:** Automatic — every push to GitHub triggers a Netlify rebuild and redeploy (~60 seconds)

### Version Control
- **Platform:** GitHub (free account)
- **Repo:** Owned by Bill / MiCAN, collaborator access granted to developer
- **Workflow:** Push to main branch → Netlify auto-deploys

---

## Sponsor Data Architecture

### JetEngine Relations

Three relations are established in JetEngine → Relations:

| Relation | Type | Status |
|---|---|---|
| Organizations CPT ↔ Sponsorships CPT | Many to Many | Existing |
| Sponsored Events CPT → Sponsorships CPT | One to Many | Existing |
| Sponsorships CPT → Sponsor Ads CPT | One to Many | New |

### Chained Relation Structure