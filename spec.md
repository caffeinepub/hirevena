# Hirevena CRM

## Current State
Recruiter Panel has: Dashboard, Candidates, Follow-ups, Activity, Profile, Campaigns tabs.
- CampaignDetailView has response submission (Interested/Not Interested) that updates canister + dispatches `crm:responseSubmitted`
- MyCandidatesTab uses only localStorage `store.candidates` — does NOT listen for real-time updates from campaign responses
- FollowUpsTab shows candidates where `followUpDate` is set — NOT based on Interested status

## Requested Changes (Diff)

### Add
- MyCandidatesTab: canister/API data fetching with useActor, `crm:responseSubmitted` event listener for instant UI refresh
- FollowUpsTab: canister/API data fetching; show candidates where status === 'Interested' (not by followUpDate); Call button (tel:) + WhatsApp button with pre-filled message "Hi {Name}, regarding your job application for {Role}..."; no duplicate entries (deduplicate by phone/id)
- Pass `recruiterEmail` prop to MyCandidatesTab and FollowUpsTab from RecruiterPanel

### Modify
- MyCandidatesTab signature: add `recruiterEmail?: string` prop
- FollowUpsTab signature: add `recruiterEmail?: string` prop; completely rewrite internals to use canister data and show Interested candidates
- RecruiterPanel: pass `recruiterEmail={currentUser.email}` to both MyCandidatesTab and FollowUpsTab
- handleSubmitResponse in CampaignDetailView: after submit, also dispatch `crm:candidateUpdated` custom event with candidate id and new status so Candidates tab can update immediately

### Remove
- FollowUpsTab: old followUpDate-based sections (Overdue/Today/Upcoming)

## Implementation Plan
1. Update `RecruiterPanel` to pass `recruiterEmail` to `MyCandidatesTab` and `FollowUpsTab`
2. Update `MyCandidatesTab`: add canister data fetching (like other tabs), listen to `crm:responseSubmitted` to refetch, show canister data when available
3. Rewrite `FollowUpsTab`: fetch all candidates from canister for recruiterEmail, filter status === 'Interested', deduplicate by phone, show Call + WhatsApp buttons with campaign role in message, auto-refresh on `crm:responseSubmitted`
4. In `CampaignDetailView.handleSubmitResponse`: after optimistic update, also emit `crm:candidateUpdated` event
