# LawFlow — Product Requirements Document
# Last Updated: 2026-03-06

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
