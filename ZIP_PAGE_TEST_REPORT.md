# Kids Champ ZIP Page Test Report

**Test date:** 2026-08-10  
**Frontend:** `http://localhost:3000/admin/kids-champ/`  
**Backend:** `http://localhost:8081`  
**Database:** Local PostgreSQL, Flyway schema version 28

## Executive result

The core ZIP workflow passes the dedicated end-to-end regression suite: changing queue counts, keeping or replacing the active target, automatic ZIP creation, manual/remainder ZIP creation, PNG conversion, filename sequencing, downloads, stable record ordering, edit/schedule/complete operations, deletion, retention cleanup, and ZIP Bin metadata preservation.

All four functional defects found in the first test run were fixed and rechecked on 2026-08-10. A dedicated regression now proves that approved records without available artwork are skipped safely instead of crashing manual ZIP generation. Live browser clicking, screenshots, and five-viewport visual verification remain blocked by the browser connector and are not marked as passed.

## Safety and cleanup

- Tests used ten uniquely named `Zip Test...` submissions inside a rollback-only database transaction.
- Existing unbatched records were changed only inside that transaction and rolled back.
- The original ZIP photo count was verified after rollback.
- No `Zip Test...` database rows remained after the test.
- Only images and archives created by the test were removed from storage.
- No WhatsApp message or email was sent to a real recipient.
- Existing administrator profiles and real ZIP records were not modified.

## Automated results

| Check | Result | Evidence |
|---|---:|---|
| Dedicated ZIP end-to-end workflow | PASS | 2 tests, 0 failures |
| ZIP queue policy integration | PASS | 1 test, 0 failures |
| ZIP naming, PNG, retention rules | PASS | 4 tests, 0 failures |
| Combined ZIP regression suite | PASS | 7 tests, 0 failures |
| Frontend targeted ESLint | PASS | 0 errors |
| Frontend production build | PASS | 23 static pages generated |
| Backend health after restart | PASS | `/api/v1/health` returned `UP` |
| Frontend route | PASS | `/admin/kids-champ/` returned HTTP 200 |
| Complete backend suite | FAIL | 20 of 22 tests passed; the same 2 old seed-dependent tests failed |
| Live browser interaction | BLOCKED | Browser connector did not expose its required safety configuration |
| Five live viewport screenshots | BLOCKED | Same browser connector limitation |

## Functional checklist

### ZIP count and current queue

- PASS: count `0` is rejected.
- PASS: minimum count `1` is accepted and generates a ZIP at one approved photo.
- PASS: count `25,000` is accepted, proving the former configured maximum of 500 is removed.
- PASS: changing the count with queued photos requires an explicit decision.
- PASS: **Finish current ZIP with old count** keeps the current target and applies the new count to the next ZIP.
- PASS: **Apply new count now** replaces the active target and generates immediately when the new target is reached.
- PASS: settings and queue state are stored in the database and restored after the isolated test rollback.
- NOTE: the backend still uses Java/PostgreSQL integer fields, so the technical numeric ceiling is 2,147,483,647 even though no business maximum is configured.

### Automatic generation

- PASS: no ZIP is created below the target.
- PASS: reaching the target automatically creates exactly one ZIP.
- PASS: automatic batches of 3, 2, and 1 photos were verified.
- PASS: the queue becomes empty after all eligible photos are assigned.
- PASS: one submission cannot be added to a second ZIP.
- PASS: the active target advances correctly after completing the old-count ZIP.

### Manual generation and recovery

- PASS: incomplete remainder requires confirmation.
- PASS: confirming the remainder creates the smaller ZIP.
- PASS: selected approved submissions create a manual recovery ZIP.
- PASS: unapproved submissions are rejected.
- PASS: already-batched submissions are rejected.
- PASS: malformed approved records with a null stored filename are skipped safely and return an admin-friendly `NO_PHOTOS` response when no valid artwork remains.

### ZIP content

- PASS: ZIP photo count matches the batch record.
- PASS: `submissions.csv` exists and includes every tracking code.
- PASS: JPEG source images are converted to real PNG bytes.
- PASS: names use queue-local numbering such as `001_Name_City.png`.
- PASS: apostrophes and slashes are converted to safe filename spaces.
- PASS: sequential entry order is deterministic in the downloaded archive.
- PASS: original submission names, parent details, and tracking metadata remain unchanged.

### Download and ordering

- PASS: the generated archive exists and has the expected `.zip` filename.
- PASS: first download records `firstDownloadedAt`.
- PASS: downloading does not restart retention.
- PASS: repeated download does not change retention.
- PASS: downloading does not reorder ZIP records.
- PASS: marking Edited is blocked before download.
- PASS: marking and clearing Edited works after download.
- PASS: the Download button inside the ZIP detail drawer uses the same archive-download handler as the record row.

### Telecast controls

- PASS: past dates are rejected.
- PASS: an alternate date earlier than the primary date is rejected.
- PASS: valid primary and alternate dates are saved.
- PASS: a scheduled ZIP can be marked complete.
- PASS: the detail drawer no longer calculates telecast status from a hard-coded date; the backend remains the status authority.

### Delete, retention, and ZIP Bin

- PASS: manual deletion is blocked before download.
- PASS: downloaded ZIP archive can be deleted.
- PASS: its artwork files are deleted.
- PASS: child, sender, submission, telecast, and ZIP metadata remain.
- PASS: the ZIP record receives a deleted timestamp and appears as a deleted/Bin record.
- PASS: removed artwork cannot return to the automatic queue.
- PASS: simulated retention expiry performs the same archive/photo cleanup without requiring a prior download.
- PASS: clearing a selected Bin record marks it purged and hides it from the normal/Bin response.

### Search, filters, and page controls

Static code-path verification passed for:

- ZIP-code search.
- All, Downloaded, Not downloaded, Edited, and Not edited filters.
- ZIP Bin toggle, Select all, and Clear selected.
- Advanced Recovery search, Ready/ZIPped filter, specific-date filter, and date-range filter.
- Retry automatic queue, Select all, Deselect all, and recovery-reason validation.
- Telecast date, Complete, WhatsApp eligibility, Edit, Download, and Delete button enable/disable rules.
- Admin-friendly API error display and filtering of technical error details.

These controls could not be physically clicked in the live browser because browser automation was unavailable. They are therefore source-verified, not visually verified.

## Resolved bugs

### BUG-ZIP-001 - Manual ZIP crashes when an approved record has no stored filename

**Severity:** High  
**Status:** Resolved and covered by regression test

**Reproduction:**

1. Have an approved, unbatched submission whose `stored_filename` is null while `photo_deleted_at` is also null.
2. Use the general manual/remainder ZIP generation path.
3. The repository query selects that submission.
4. ZIP generation calls `KidsChampStorage.photo(null)` and throws `NullPointerException`.

**User impact:** The admin sees the generic “ZIP action could not be completed” message and cannot generate the requested manual ZIP.

**Cause:** `createBatch` filters `photoDeletedAt` but does not require `storedFilename` to be non-null, unlike the automatic queue query.

**Resolution:** General manual/remainder generation now selects only approved, unbatched rows with an available stored filename. If none remain, it returns an admin-friendly `NO_PHOTOS` response. Selected recovery already validates each selected photo separately.

### BUG-ZIP-002 - Expiry value in the ZIP detail drawer is not persisted

**Severity:** High  
**Status:** Resolved and verified by lint/build

**Reproduction:**

1. Open a ZIP record.
2. Click **Edit expiry / date**.
3. Change only **Expires in** and save.
4. Nothing is saved when no telecast date exists; with a date, the request sends only telecast fields.

**Cause:** The drawer changes `draft.expires`, but `updateZip` calls only the schedule endpoint and sends `telecastDate` plus `alternateTelecastDate: null`.

**Resolution:** The unsupported expiry editor was removed. The drawer keeps the existing layout, shows retention as read-only, and explains that it is fixed when the ZIP is generated. The edit action now changes only the telecast date.

### BUG-ZIP-003 - Drawer Download button does not download

**Severity:** Medium  
**Status:** Resolved and verified by lint/build

**Reproduction:**

1. Open a ready ZIP record.
2. Click **Download** inside the detail drawer.
3. The drawer closes and shows an instruction to use the list Download button.

**User impact:** A control labelled Download does not perform its named action.

**Resolution:** The drawer Download button is connected to the same `downloadZip` handler used by the record row.

### BUG-ZIP-004 - Hard-coded telecast date in ZIP editor

**Severity:** Medium  
**Status:** Resolved and verified by lint/build

**Cause:** The drawer calculates telecast state by comparing the selected date with the fixed value `2026-08-01` instead of using the backend completion status/current date.

**Resolution:** The fixed-date comparison and local status override were removed. The schedule/completion endpoints remain the source of telecast status.

## Additional quality findings

1. The Advanced Recovery help text now correctly shows `001_child name_hometown.png`.
2. The complete backend suite contains old tests tied to mutable shared seed data:
   - expected 105 bulk records, database contains 905;
   - expected two matching sample records, found zero in that test state.
3. The Next.js build warns that multiple lockfiles cause automatic workspace-root inference.
4. Five responsive tiers are configured globally (mobile baseline, tablet, laptop, desktop, monitor), but live visual behavior at those widths remains unverified because browser automation was blocked.

## Remaining verification work

1. Isolate/reset the old bulk workflow test fixtures before using the complete suite as a release gate.
2. Repeat all live clicks and screenshots at the five required viewport sizes when the browser connector is available.
