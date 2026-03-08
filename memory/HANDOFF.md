# LawFlow — Emergent Platform Handoff
# Last Updated: 2026-03-08 (Phase 21 Complete)

================================================================================
CURRENT STABLE STATE — Phase 21 Complete
================================================================================

Phase 15 — Multi-Advocate Firm Mode, Client Portal, eCourts High Court   COMPLETE
Phase 16 — EAS projectId + Emergent platform migration                   COMPLETE
Phase 17 — WhatsApp Integration for Hearing Reminders                    COMPLETE
Phase 18A — Bulk WhatsApp Reminder Screen                                COMPLETE
Phase 18B — Professional PDF Reports (expo-print)                        COMPLETE
Phase 19 — Video Launch Screen (expo-video)                              COMPLETE
  - New screen: /app/frontend/app/intro.tsx
  - Uses expo-av Video component (Expo Go compatible, SDK 54)
  - Video: /app/frontend/assets/videos/intro.mp4 (local) + /api/static/intro.mp4 (web)
  - Plays muted, fullscreen, no controls, black background
  - Skip button (testID: intro-skip-btn) visible immediately, top-right
  - 5-second auto-navigation timer → auth check → login
  - Cold launch only: module-level `introShown` flag in index.tsx + useRef guard
  - Flow: index.tsx → /intro → video plays → 5s/skip → back to / → auth → login/tabs
  - Backend: FastAPI StaticFiles serves /api/static/intro.mp4 for web playback
  - _layout.tsx: intro screen registered with animation: 'fade'
Phase 20 — Play Store Readiness Fixes                                    COMPLETE
  - Fix 1: New User Signup screen (app/signup.tsx) — appears after first OTP verify if name is null
    Fields: Full Name*, Bar ID*, Bar Council* (picker), Email (optional), Practice Areas (chips)
    After save → updateAdvocateProfile → navigate to /(tabs)
  - Fix 2: Calendar filing dates — orange dots (#FF9500) for case filing/registration dates
    "Case Filings" section in day panel when tapping a date with filings
  - Fix 3: Print reports fixed — web uses window.open() + print(), native uses expo-print + expo-sharing
    All 4 reports work: Cause List, Case Detail, Client Summary, Hearing History
  - Fix 4: Greeting time ranges corrected — Morning 5-11:59, Afternoon 12-4:59, Evening 5-8:59, Night 9-4:59
  - Fix 5: Custom case types — "Add Custom Type" option in case form picker
    customCaseTypes state in AppContext (follows customStatuses pattern), persisted in AsyncStorage
  - Fix 6: Firm creation verified working — backend POST /api/firms returns 200, frontend passes auth token
  - Fix 7: Expo Go fixed — expo-asset peer dependency installed (previous session)
  - Fix 8: Delete case verified working — removes case + hearings from local state + backend
Phase 21 — Platform Migration + Bug Fixes                                COMPLETE
  - Migrated from GitHub to Emergent platform (git clone → rsync with protected .env preserved)
  - Backend dependencies installed: pytz, beautifulsoup4, lxml in /root/.venv
  - Backend .env updated: APP_ENV=development, JWT_SECRET added
  - OTP double-submit fixed: submittingRef guard prevents race condition in otp.tsx
  - Intro skip navigation fixed: useRef guard replaces module-level _navigated flag
  - Tab bar testIDs added: tab-dashboard, tab-cases, tab-calendar, tab-clients, tab-more
  - HANDOFF.md cleaned: removed git clone lines
  - Test result: 9/9 backend tests pass, 18/20 frontend features verified
Phase 21 Bug Fixes (re-test)                                             COMPLETE
  - Intro Skip navigation fixed: navigateAway() now does AsyncStorage token check
    directly → routes to /login or /(tabs), bypassing index.tsx completely
  - OTP double-submit fixed: submittingRef guard in handleVerify()
  - Final test result: 20/20 frontend + 9/9 backend — ALL PASSING ✅
Phase 22 — Expo Go Native Crash Fix                                      COMPLETE
  - Removed expo-av import from intro.tsx (ExponentAV not in Expo Go SDK 54)
  - Web still uses HTML <video> tag; native shows black screen + skip + 5s timer
Phase 23 — Google Drive File Storage                                     COMPLETE
  - expo-av → expo-audio migration in VoiceNotesSection + voice-notes.tsx
    (fixes remaining expo-av crash on Expo Go SDK 54)
  - New: src/services/googleDriveFiles.ts — folder creation, file upload, token mgmt
  - New: src/components/common/DriveSetupSheet.tsx — Drive prompt bottom sheet
  - New: backend/routes/case_files.py — metadata-only CRUD (never stores binary)
  - AppContext: isDriveConnected, driveEmail, connectDrive, disconnectDrive,
    updateDocumentDriveSync, updateVoiceNoteDriveSync — ADDED ONLY, no refactor
  - cases/[id].tsx: Drive check before file picker; Drive icon + upload-cloud
    button per document; DriveSetupSheet shown if not connected
  - voice-notes.tsx + VoiceNotesSection: record-then-upload-to-Drive flow;
    Drive banner when disconnected; cloud/smartphone icons per note
  - settings.tsx: STORAGE section with Google Drive connect/disconnect;
    "View LawFlow folder in Drive" link when connected
  - Drive folder structure: LawFlow/[CaseNumber — ClientName]/Documents|VoiceNotes/
  - Files never stored in MongoDB — only metadata (fileId, fileUrl, localUri)
  - EXPO_PUBLIC_GOOGLE_CLIENT_ID=REPLACE_WITH_GOOGLE_CLIENT_ID in .env
    → User must replace with real OAuth client ID from Google Cloud Console
  - Test result: 8/8 backend case-files tests + all frontend features ✅

### Phase 18A — Bulk WhatsApp Reminders
- Screen: /app/frontend/app/bulk-reminders.tsx
- Entry: Dashboard "📤 Bulk Remind" button (Tomorrow's Hearings card)
- Entry: More tab → TOOLS → "📤 Bulk Reminders"
- Checkbox list of tomorrow's hearings with per-row preview/edit modal
- "Send All" flow: opens WhatsApp one-by-one via wa.me deep links
- AsyncStorage per-case-per-day sent status (auto-resets next day)
- Empty state: "🎉 No hearings tomorrow!" when no hearings
- Backend Job: APScheduler 8 PM IST evening reminder
- 8 unit tests in backend/tests/test_scheduler_reminders.py

### Phase 18B — Professional PDF Reports
- 4 new report functions added to pdfReports.ts (existing functions untouched)
- Report 1: Daily Cause List — Dashboard → Print (testID: print-daily-report-btn)
- Report 2: Case Detail — Case Detail → Print (testID: print-case-btn)
- Report 3: Client Summary — Client Detail → Print (testID: print-client-btn)
- Report 4: Hearing History — Case Detail → Hearing History → Print
  (testID: print-hearing-history-btn)
- All reports: B&W, Arial font, DD MMM YYYY dates, +91 phone format
- Letterhead: Advocate Name, Bar Council, Bar ID, Phone, Email
- Web: browser print dialog | Mobile: PDF → share sheet (expo-sharing)

================================================================================
FULL SETUP INSTRUCTIONS (new Emergent account)
================================================================================

### 1. Backend Setup
python3 -m venv .venv && source .venv/bin/activate
cd /app/backend && pip install -r requirements.txt
pip install beautifulsoup4 lxml

### 3. Frontend Setup
cd /app/frontend && yarn install

### 4. Start Backend
cd /app/backend && uvicorn server:app --host 0.0.0.0 --port 8001 --reload

### 5. Start Frontend
cd /app/frontend && yarn expo start --web

### 6. Test Credentials
Phone: 9876543210 | OTP: 123456
(Works in development mode — APP_ENV=development)

================================================================================
ENVIRONMENT VARIABLES
================================================================================

### Backend — /app/backend/.env
MONGO_URL="mongodb://localhost:27017"      # MongoDB connection string
DB_NAME="test_database"                     # Database name
APP_ENV="development"                       # "development" or "production"
JWT_SECRET="<your-secret>"                  # JWT signing key (auto-generates dev fallback if missing)
MSG91_AUTH_KEY="<your-key>"                 # MSG91 SMS OTP (pending DLT registration)
MSG91_TEMPLATE_ID="<your-template-id>"     # MSG91 template (pending DLT registration)

### Frontend — /app/frontend/.env
EXPO_PUBLIC_BACKEND_URL=<preview-url>       # Set by Emergent platform (DO NOT MODIFY)
EXPO_PUBLIC_GOOGLE_CLIENT_ID="<client-id>"  # Google Drive backup (optional)

### Protected (DO NOT MODIFY)
EXPO_PACKAGER_PROXY_URL   — Set by Emergent platform
EXPO_PACKAGER_HOSTNAME    — Set by Emergent platform

================================================================================
REMAINING PRODUCTION ITEMS
================================================================================

1. Replace app icons:
   /app/frontend/assets/images/icon.png
   /app/frontend/assets/images/splash-image.png
   /app/frontend/assets/images/adaptive-icon.png

2. Complete MSG91 DLT registration:
   - Register sender ID and SMS template with TRAI DLT portal
   - Set MSG91_AUTH_KEY and MSG91_TEMPLATE_ID in backend .env

3. Set production JWT_SECRET in backend .env

4. Run production EAS builds:
   cd /app/frontend && eas build --profile production --platform android
   cd /app/frontend && eas build --profile production --platform ios

5. Submit to stores:
   - Google Play Store (Android)
   - Apple App Store (iOS)

### EAS Configuration
- EAS projectId: 940a89bf-27e1-44e1-b036-9f64bc3e92a4
- Owner: decoyindia
- EAS Project: https://expo.dev/accounts/decoyindia/projects/lawflow

================================================================================
CRITICAL RULES FOR NEXT AGENT
================================================================================

1. NEVER refactor AppContext.tsx — only ADD new exports/functions
2. Read this HANDOFF.md before touching any code
3. NEVER modify metro.config.js
4. NEVER modify EXPO_PACKAGER_HOSTNAME or EXPO_PUBLIC_BACKEND_URL in .env
5. Backend routes MUST be prefixed with /api
6. Pre-warm metro cache before starting expo after full cache clear:
   cd /app/frontend && yarn expo export --platform web
   Then: sudo supervisorctl start expo

### Restart Commands
- Backend: sudo supervisorctl restart backend
- Frontend: rm -rf /app/frontend/.metro-cache/cache && sudo supervisorctl restart expo

### Test Credentials
- Phone: 9876543210
- OTP: 123456
- Works only when APP_ENV=development (dev mode auto-accepts any 6-digit OTP for this number)
