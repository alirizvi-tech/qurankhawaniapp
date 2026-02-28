# Quran Khuwani Tracker

## Overview
A full-stack web app for coordinating Quran recitation (Khuwani) for a deceased person (Marhoom). Organizers create sessions and share links; participants claim Siparas without needing accounts.

## Tech Stack
- **Frontend:** React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Express.js + TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** bcryptjs for password hashing, express-session for organizer sessions

## Architecture
- `shared/schema.ts` - Database schema (organizers, khuwanies, claims) + Zod validation + constants (SIPARA_NAMES_ARABIC, ARABIC_NUMERALS)
- `server/routes.ts` - All API routes (auth, organizer CRUD, participant claim/unclaim, add-quran)
- `server/storage.ts` - Database storage layer using Drizzle ORM (includes incrementQurans)
- `client/src/pages/organizer-login.tsx` - Login/Register page
- `client/src/pages/organizer-dashboard.tsx` - Organizer dashboard (create, manage, share, add Qurans)
- `client/src/pages/participant-view.tsx` - Public participant view (claim/release Siparas with Arabic names)

## Key Features
- Organizer registration/login with session-based auth
- Create Khuwani sessions (starts with 1 Quran, organizer can add more dynamically)
- "Add Quran" button on dashboard to dynamically grow a Khuwani
- Shareable public links (slug-based URLs like `/k/marhoom-name-xxxxx`)
- Real-time Sipara claiming with race condition prevention (DB unique constraint)
- No upfront name entry — name is asked per-claim via dialog popup when tapping a para
- Anyone can claim for anyone, anyone can release any claim
- Arabic para names (SIPARA_NAMES_ARABIC) and Arabic numerals on Sipara cards
- Auto-refresh every 8 seconds for live updates
- Light/Dark theme toggle on participant view (localStorage persisted)
- Dark Islamic-inspired theme with green/gold color palette
- Light mode with warm cream/ivory tones and high-contrast readable text

## Design
- Dark mode: green-black background (#070c07), gold accent (#d4af37), warm off-white text
- Light mode: cream background (#fefcf6), warm gold accents (#8b6914), dark text (#2d2416)
- Amiri font for Arabic text, Lato for English UI
- Mobile-first responsive design (primarily shared via WhatsApp)

## API Endpoints
- POST /api/organizer/register, /api/organizer/login, /api/organizer/logout
- GET /api/organizer/session, /api/organizer/khuwanies
- POST /api/organizer/khuwani/create, /:id/delete, /:id/reset, /:id/add-quran
- GET /api/k/:slug (public participant data)
- POST /api/k/:slug/claim, /api/k/:slug/unclaim
