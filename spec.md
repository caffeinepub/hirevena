# Hirevena – Admin Panel

## Current State
- Full Hirevena B2B recruitment website is live.
- Backend stores inquiry submissions with fields: id, companyName, contactName, phoneNumber, emailAddress, role, positions, urgency, timestamp.
- No admin authentication or lead management exists.
- No way to view, manage, or export submitted inquiries.

## Requested Changes (Diff)

### Add
- Admin login page at `/admin` route (hardcoded credentials: ID `Utkarsh809071`, Password `U80907120`).
- Admin dashboard with summary cards: Total Leads, New Leads Today, Pending Follow-ups, In Progress, Closed Deals.
- Lead management table showing all submissions with columns: Date, Company, Contact, Phone, Email, Position, Candidates, Location, Urgency, Status, Notes, Follow-up Date, Actions.
- Lead status management: New / Contacted / In Progress / Closed / Rejected.
- Notes field per lead (editable inline).
- Follow-up date per lead (editable inline).
- CSV export of all leads.
- Backend: add `updateLead` function to update status, notes, follow-up date on a submission.
- Backend: add `deleteSubmission` function.
- Backend: extend Submission type with `status`, `notes`, `followUpDate` fields.
- Protected route: direct URL access to `/admin/dashboard` without login redirects to `/admin`.

### Modify
- Submission type in backend to include status (default "New"), notes (default ""), followUpDate (default "").
- Frontend routing: App renders main website at `/`, admin panel at `/admin` (login) and `/admin/dashboard`.

### Remove
- Nothing removed from existing website.

## Implementation Plan
1. Update `main.mo` to extend Submission with status/notes/followUpDate, add `updateLead(id, status, notes, followUpDate)` and `deleteSubmission(id)` functions.
2. Re-generate `backend.d.ts` types.
3. Create `AdminLogin.tsx` – simple login form, validates hardcoded credentials, stores session in localStorage, redirects to `/admin/dashboard`.
4. Create `AdminDashboard.tsx` – protected page showing:
   - Summary stat cards at top.
   - Full leads table with inline status select, notes edit, follow-up date.
   - Delete action per row.
   - CSV export button.
5. Add React Router to App.tsx with `/` → main site, `/admin` → login, `/admin/dashboard` → dashboard (guarded).
