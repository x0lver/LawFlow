# LawFlow — Product Requirements Document
# Last Updated: 2026-03-08

## Phase 23 — Google Drive File Storage (COMPLETE)
### What was done
- expo-av completely removed from VoiceNotesSection + voice-notes.tsx (fixes Expo Go SDK 54 crash)
- Migrated to expo-audio: useAudioRecorder, useAudioPlayer hooks
- New: src/services/googleDriveFiles.ts — OAuth token persistence, folder creation, file upload
- New: src/components/common/DriveSetupSheet.tsx — "Google Drive Required" bottom sheet
- New: backend/routes/case_files.py — metadata CRUD (never stores binary files in MongoDB)
- AppContext: isDriveConnected, driveEmail, connectDrive, disconnectDrive ADDED (no refactor)
- cases/[id].tsx: Drive check before file picker; Drive/local icons per doc; upload-to-Drive
- settings.tsx: STORAGE section with Drive connect/disconnect + "View in Drive" link
- Folder structure: LawFlow/[CaseNumber — ClientName]/Documents|VoiceNotes/
- EXPO_PUBLIC_GOOGLE_CLIENT_ID placeholder in .env — user must add real ID

### To activate Google Drive:
1. console.cloud.google.com → Create OAuth 2.0 Web client ID
2. Add https://auth.expo.io as Authorized Redirect URI
3. Replace REPLACE_WITH_GOOGLE_CLIENT_ID in frontend/.env
4. Restart expo service

### Test Results
- Backend case-files: 8/8 tests pass
- Frontend: all Phase 23 features verified ✅
- expo-av crash on Expo Go: RESOLVED

### What was done
- Migrated project from GitHub to Emergent platform (protected .env files preserved)
- Backend dependencies installed in /root/.venv: pytz, beautifulsoup4, lxml, APScheduler
- Backend .env updated: APP_ENV=development, JWT_SECRET set
- OTP double-submit fixed in otp.tsx using submittingRef guard
- Intro skip navigation fixed in intro.tsx using useRef (replaces module-level flag)
- Tab bar testIDs added (tab-dashboard, tab-cases, tab-calendar, tab-clients, tab-more)
- HANDOFF.md cleaned: all git clone lines removed

### Test Results (Phase 21)
- Backend: 9/9 API tests passed (health, auth, profile, cases CRUD, clients CRUD, hearings)
- Frontend: 18/20 features verified
- Auth endpoint confirmed: /api/auth/request-otp (not send-otp)

## Product Overview
LawFlow is a legal practice management app for Indian advocates built with Expo (React Native) and FastAPI/MongoDB backend.

## Phase 18A — Bulk WhatsApp Reminder Screen (COMPLETE)
### Requirements
- "Bulk Reminders" screen to send WhatsApp reminders to ALL clients with hearings tomorrow
- Entry points: Dashboard Tomorrow's Hearings card + More tab
- Client list with checkboxes, preview/edit messages, send-all flow
- AsyncStorage sent status per case+date

### Implementation
- `/app/frontend/app/bulk-reminders.tsx` — Full screen with list, preview modal, send confirmation
- `wa.me` deep links for WhatsApp
- Sent status in AsyncStorage auto-resets daily

## Phase 18B — Professional PDF Reports (COMPLETE)
### Requirements
- Replace screenshot-based printing with clean HTML PDF generation
- 4 reports: Cause List, Case Detail, Client Summary, Hearing History
- Letterhead with advocate details on all reports
- B&W, Arial font, DD MMM YYYY dates, +91 phone format

### Implementation
- Added to `/app/frontend/src/utils/pdfReports.ts` (existing functions untouched)
- `printCauseList()` — Dashboard print, Daily Cause List
- `printCaseDetail()` — Case Detail print, full case report
- `printClientSummary()` — Client Detail print, client overview
- `printHearingHistory()` — Hearing History print, hearing table + stats
- All use expo-print → expo-sharing

### Print Button Locations
| Report | Screen | testID |
|--------|--------|--------|
| Cause List | Dashboard header | print-daily-report-btn |
| Case Detail | Case Detail header | print-case-btn |
| Hearing History | Case Detail → Hearing section | print-hearing-history-btn |
| Client Summary | Client Detail header | print-client-btn |

## Tech Stack
- Frontend: Expo SDK 54, React Native, TypeScript, expo-router
- Backend: FastAPI, MongoDB, APScheduler
- Auth: Phone + OTP (MSG91)
- PDF: expo-print + expo-sharing
- Storage: AsyncStorage (local), MongoDB (backend)
