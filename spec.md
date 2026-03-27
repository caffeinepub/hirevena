# Hirevena

## Current State
Recruiter signup requests are stored in device-local localStorage. API calls to Google Apps Script fail silently when no URL is configured. Admin Notifications panel fetches from API (returns null) and merges with its own localStorage — so phone signups never reach the admin's laptop.

## Requested Changes (Diff)

### Add
- Motoko backend functions: `submitSignupRequest`, `getSignupRequests`, `approveSignupRequest`, `rejectSignupRequest`
- These store pending recruiter signups in the canister (truly cross-device)

### Modify
- `handleSignupSubmit` in App.tsx: call backend `submitSignupRequest` instead of localStorage
- `NotificationsSection` in AdminCRM.tsx: call `getSignupRequests` from backend to display pending requests
- Approve/Reject buttons: call backend `approveSignupRequest` / `rejectSignupRequest`
- Recruiter login: check backend-approved recruiters list for cross-device login support

### Remove
- localStorage-only signup request saving (replace with backend calls)

## Implementation Plan
1. Generate new Motoko backend adding signup request CRUD
2. Update App.tsx handleSignupSubmit to use backend.submitSignupRequest
3. Update NotificationsSection to fetch from backend.getSignupRequests
4. Update approve/reject to call backend functions
5. Update recruiter login to check backend for approved status
