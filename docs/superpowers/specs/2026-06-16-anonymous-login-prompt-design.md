# Anonymous Login Prompt Design

Date: 2026-06-16
Status: Approved for implementation planning
Repository: ScanSci Portal (`scansci-portal-repo`)

## Purpose

ScanSci should stay usable before registration, while gently encouraging visitors to create an account after they have tried enough tools to understand the value. The selected strategy is the aggressive reminder version:

- Anonymous users can browse, search, filter, and open tools without interruption for the first three tool-open clicks.
- On the fourth tool-open click, the portal pauses that navigation and shows the existing login/register modal.
- If the user closes the modal, the portal does not auto-open it again on the same local calendar day.
- Starting on the next local calendar day, continued anonymous tool opens can trigger the prompt again.
- Logged-in users keep the current synced behavior for favorites, recent usage, preferences, and ratings.

This design does not make ScanSci a closed login-only product. It adds a conversion prompt while preserving public discovery.

## Existing System Context

The portal already has a user system:

- Static frontend: `index.html`, `styles.css`, `app.js`.
- API Worker: `worker/src/index.js`.
- Database: Cloudflare D1 binding `DB`.
- Authentication: GitHub OAuth and email verification code.
- Session: HttpOnly secure cookie.
- User-owned data already exists for favorites, actions, and journal ratings.

Relevant current tables include:

- `users`
- `github_links`
- `email_verification_codes`
- `user_email_verifications`
- `user_actions`
- `user_favorites`
- `journal_user_ratings`

The new prompt should reuse the existing login modal and auth flow instead of introducing a second registration surface.

## Scope

In scope:

- Add frontend-only anonymous prompt state in `localStorage`.
- Count anonymous "open tool" attempts, not passive page views.
- Auto-open the existing auth modal when the prompt rule matches.
- Suppress repeated auto-prompts for the rest of the same local calendar day after the modal is closed.
- Clear anonymous prompt state after a successful login.
- Keep favorites and other durable personal data behind authenticated APIs.
- Document data durability and capacity rules for future user-owned sub-application data.

Out of scope for this change:

- Forcing login before opening tools.
- Migrating anonymous local activity into a newly created user account.
- Adding an admin dashboard for users.
- Adding paid plans, quotas, or billing.
- Reworking child apps to share the portal session.
- Storing anonymous visitor identifiers on the server.

## User Experience

Anonymous visitor flow:

1. The visitor lands on the portal and can browse normally.
2. Each click on a tool card's open link increments a local anonymous open counter.
3. Opens 1, 2, and 3 continue without automatic login interruption.
4. On open 4, the portal pauses the clicked link and opens the login/register modal.
5. The visitor can sign in, register by email code, use GitHub, or close the modal.
6. If closed, the portal records the dismissal and then continues to the originally clicked tool URL.
7. The portal records that the automatic prompt was dismissed for today's local date.
8. Later opens on the same local date do not auto-open the modal.
9. On a later local date, another anonymous open can prompt again.

The prompt is still an invitation rather than a hard login wall: closing the prompt lets the original tool-open intent continue.

Logged-in visitor flow:

1. `GET /api/me` loads the user and favorites.
2. Tool opens continue to be recorded with `POST /api/actions`.
3. Favorites and authenticated data continue to use D1 and `user_id`.
4. Anonymous prompt state is cleared after login.

## Prompt Rules

Use local browser dates for the daily suppression rule, because the user expectation is "do not remind me again today" rather than "wait exactly 24 hours."

Suggested constants:

```js
const ANON_PROMPT_THRESHOLD = 4;
const ANON_PROMPT_STORAGE_KEY = "scansci:anonPrompt:v1";
```

Suggested local state shape:

```json
{
  "toolOpenCount": 4,
  "lastPromptDate": "2026-06-16",
  "dismissedDate": "2026-06-16",
  "pendingToolUrl": "https://journal.scansci.com",
  "pendingToolSetAt": 1781596800000
}
```

Prompt eligibility:

- User is not logged in.
- The current interaction is a tool open.
- `toolOpenCount >= 4`.
- `dismissedDate !== todayLocalDate`.
- The auth modal is not already open.

Navigation behavior:

- When the prompt is eligible, prevent the default same-tab navigation.
- Store the clicked tool URL as a pending tool URL.
- The pending URL must come from the rendered app catalog, not from arbitrary query parameters.
- Closing the auto-opened modal navigates to the pending URL and clears it.
- Successful email login from the modal should clear anonymous prompt state and navigate to the pending URL.
- GitHub login can persist the pending URL briefly in `localStorage`; after the OAuth callback returns to the portal and `loadMe()` succeeds, the portal can continue to the pending URL if it is still fresh.
- Pending tool URLs older than 10 minutes should be ignored and cleared.

Dismissal behavior:

- Closing the modal via close button, backdrop, or Escape sets `dismissedDate` to today's local date when the modal was auto-opened by the anonymous prompt.
- Manual login button clicks should not necessarily set `dismissedDate`; only dismissing an automatic prompt should.

Login behavior:

- Successful email login and successful GitHub callback should result in `loadMe()` finding a user.
- Once a user is present, consume any fresh pending tool URL first, then remove `scansci:anonPrompt:v1` from `localStorage`.

## Data Model

No new database tables are required for the prompt itself.

Anonymous state remains local-only:

- It is not durable.
- It does not identify a person.
- It can be cleared by the browser or user.
- It should not be used for security, quotas, or abuse prevention.

Durable account data remains server-owned and keyed by `user_id`:

- Favorites: `user_favorites`.
- Recent and behavioral events: `user_actions`.
- Journal ratings: `journal_user_ratings`.
- Future preferences: add explicit tables such as `user_preferences`.
- Future child-app data: create app-specific tables with `user_id`, stable IDs, timestamps, and indexes.

Future app-owned data should not be stored as large opaque JSON blobs in `user_actions`. Use JSON only for small event payloads and audit metadata.

## Data Durability And Migrations

User data must be treated as production data once accounts are encouraged.

Rules:

- Every schema change goes through an additive SQL migration first.
- Avoid destructive migrations on user tables.
- Prefer adding nullable columns or new tables, backfilling in batches, then tightening behavior in code.
- Do not drop columns or tables until a backup/export has been verified and old code no longer depends on them.
- Keep foreign keys from app-owned data to `users(id)` where appropriate.
- Add indexes for common per-user queries before user volume grows.
- Keep secrets, tokens, and service endpoints out of docs and commits.

D1 Time Travel provides point-in-time recovery. Current Cloudflare docs state D1 Time Travel can restore within 30 days on Workers Paid and 7 days on Workers Free. For long-term protection, schedule regular D1 exports into R2 or another backup target.

## Capacity

The current data shape is small. Favorites, preferences, ratings, and recent actions are row-based metadata rather than large content. A single D1 database is enough for the near-term portal account system.

Practical storage guidance:

- D1 is appropriate for users, preferences, favorites, ratings, small events, and relational app metadata.
- R2 should be used for large files, generated decks, uploaded PDFs, image assets, exports, or long analysis artifacts.
- D1 rows should store references to R2 objects, ownership, status, timestamps, and small metadata.
- Old high-volume event data should eventually be summarized or retained with a policy instead of growing forever.

Cloudflare's current D1 platform limits include a 10 GB maximum database size on Workers Paid and 500 MB on Free, with account-level storage limits. R2 is the better destination for large unstructured objects.

## Components

Frontend additions in `app.js`:

- Anonymous prompt state helpers:
  - `getTodayLocalDate()`
  - `loadAnonPromptState()`
  - `saveAnonPromptState(state)`
  - `clearAnonPromptState()`
  - `recordAnonymousToolOpen()`
  - `shouldAutoPromptLogin(state)`
  - `setPendingAnonToolUrl(url)`
  - `consumePendingAnonToolUrl()`
- Modal open metadata:
  - Track whether the auth modal was opened automatically by the anonymous prompt.
  - Mark same-day dismissal only for that auto-opened prompt.
- Tool-open integration:
  - Hook into the existing `onOpenToolClick`.
  - Count only unauthenticated opens.
  - On eligible prompt opens, prevent the default navigation and resume it only after dismissal or successful login.
- Login integration:
  - If a fresh pending tool URL exists, continue to it after login.
  - Clear local anonymous prompt state after `state.me` becomes non-null and pending navigation is consumed.

Backend:

- No backend change is required for the prompt.
- Existing `/api/me`, `/api/actions`, and auth routes remain unchanged.

Documentation:

- Update portal README or deployment notes only if implementation changes introduce new behavior operators need to know.

## Error Handling

Local storage failures:

- If `localStorage` is unavailable or throws, fail open.
- Do not block tool navigation.
- Do not show repeated modals due to storage errors.

Malformed local state:

- Ignore invalid JSON and recreate a clean state.

Authentication API failures:

- Existing behavior remains: run as guest if `/api/me` is unavailable.
- Prompt can still display, but login errors are handled by existing modal messaging.

Multiple tabs:

- The prompt state is local and eventually consistent across tabs.
- No cross-tab locking is required.

Clock/date edge cases:

- Use the browser's local date string.
- If the local date changes, the next eligible open may prompt again.

## Testing

Unit or browser-level checks should cover:

- Anonymous opens 1-3 do not auto-open login.
- Anonymous open 4 auto-opens the login modal.
- Anonymous open 4 prevents immediate same-tab navigation and records a pending tool URL.
- Closing the auto-opened modal suppresses further auto-prompts on the same local date.
- Closing the auto-opened modal continues to the originally clicked tool URL.
- A later local date permits another auto-prompt.
- Manual login button use does not incorrectly mark the auto-prompt as dismissed.
- Logged-in users never receive the anonymous prompt.
- Successful login clears anonymous prompt state and consumes any fresh pending tool URL.
- Stale pending tool URLs are ignored and cleared.
- `localStorage` read/write failure does not block opening a tool.

Manual QA:

- Test on desktop and mobile widths.
- Confirm tool navigation resumes after dismissing the prompt.
- Confirm existing favorites login behavior is unchanged.
- Confirm Escape, backdrop click, and close button all suppress same-day auto-prompts only when appropriate.

## Rollout

This feature can ship behind a simple frontend constant. No database migration is needed.

Recommended rollout:

1. Implement local prompt state helpers.
2. Integrate with `onOpenToolClick`.
3. Verify login and modal dismissal behavior locally.
4. Deploy static portal files.
5. Watch for user complaints or conversion changes.

If the prompt feels too aggressive after release, the threshold or same-day suppression rule can be adjusted without changing server data.

## References

- Cloudflare D1 limits: https://developers.cloudflare.com/d1/platform/limits/
- Cloudflare D1 Time Travel and backups: https://developers.cloudflare.com/d1/reference/time-travel/
- Cloudflare R2 limits: https://developers.cloudflare.com/r2/platform/limits/
