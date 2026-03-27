# Hirevena CRM

## Current State
Recruiter panel submits Interested/Not Interested responses. After submission, the UI doesn't immediately reflect the change (waits for next 4-second poll). Dashboard stats in both recruiter and admin panels show wrong/zero counts because:
- `updatedAt` is saved as ISO string to canister but dashboard filters use `toLocaleDateString("en-IN")` prefix match
- `apiLeads` local state is never updated after response submission — only `store.candidates` is updated, but UI renders from `apiLeads`
- Admin DashboardSection reads only from localStorage `store.candidates`, never from ICP canister
- `computeStats` filters by `c.assignedRecruiter === r.id` but canister data uses `assignedTo` (email string)
- `RecruiterDashboardTab` and `ActivityTab` only fetch via Google Apps Script API (skipped if no API URL), not canister
- Activity logs stored only in device localStorage, never synced to canister

## Requested Changes (Diff)

### Add
- In `DashboardSection` (AdminCRM.tsx): `useEffect` that fetches `actor.getAllAssignedCandidates()` every 5 seconds and stores in local state `canisterCandidates`; use this for all stats computation
- In `RecruiterDashboardTab` and `ActivityTab`: also fetch from canister (`actor.getAssignedCandidates(email, "")`) as primary source, not just Google Apps Script
- Reconstruct activity log in `LogsSection` from canister candidates' updatedAt+status fields

### Modify
- `handleSubmitResponse` in `CampaignDetailView`:
  - Change `updatedAt = new Date().toISOString()` → `new Date().toLocaleString("en-IN")` (consistent format)
  - After submission, optimistically update `apiLeads` local state immediately: `setApiLeads(prev => prev.map(c => c.id === responseCandidate.id ? { ...c, status: responseStatus, updatedAt } : c))`
  - Pass `updatedAt` to `store.updateCandidate` call
- `updateCandidate` in `useCRMStore.ts`: When caller passes `updatedAt` in the `updates` object, use that value instead of generating a new one
- `computeStats` in `useCRMStore.ts`: Check both `c.assignedRecruiter === r.id` AND `c.assignedTo?.toLowerCase() === r.email?.toLowerCase()` when filtering candidates for a recruiter
- `ActivityTab` top stat cards: use canister/API leads data for counts instead of `recruiter.calls` from store
- Campaign Performance table (AdminCRM.tsx): use `canisterCandidates` state when available, fall back to `store.candidates`
- `callsToday` in DashboardSection: use `canisterCandidates` when available

### Remove
- Hardcoded fake historical data in `lineData` in DashboardSection (lines like `[12, 18, 15, 22, 19, 25, callsToday || 10]`) — replace with real computed data from canister candidates' `updatedAt` per day

## Implementation Plan
1. Fix `handleSubmitResponse` in RecruiterPanel.tsx — optimistic `apiLeads` update + locale `updatedAt` format
2. Fix `updateCandidate` in useCRMStore.ts — honor passed `updatedAt`
3. Fix `computeStats` in useCRMStore.ts — handle email-based `assignedTo`
4. Fix `RecruiterDashboardTab` — fetch from canister as primary
5. Fix `ActivityTab` — fetch from canister, fix stat cards
6. Fix `DashboardSection` in AdminCRM.tsx — fetch all candidates from canister, use for stats
7. Fix Campaign Performance table — use canister data
8. Fix `LogsSection` — reconstruct from canister data
9. Remove hardcoded chart data
