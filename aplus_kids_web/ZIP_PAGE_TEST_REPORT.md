# Kids Champ ZIP Page Test Report

**Final test date:** 2026-08-13

**Branch tested:** `codex/kidschamp-zip-integration`

**Frontend:** isolated canonical checkout on `http://localhost:3012`

**Backend:** isolated canonical build on `http://localhost:8082`

**Database:** local PostgreSQL, Flyway schema version 34

## Result

PASS. The ZIP lifecycle, edited checkbox, download ordering, retention, automatic and manual batching, ZIP Bin, friendly errors, upload policy, database connection indicator, and all five responsive layouts passed their final checks. No remaining must-fix blocker was found in the independent integration review.

## Validation summary

| Check | Result | Evidence |
|---|---:|---|
| Complete backend suite | PASS | 38 tests, 0 failures, 0 errors, 2 deterministic fixture skips |
| ZIP lifecycle integration | PASS | 6/6 |
| ZIP queue integration | PASS | 2/2 |
| ZIP rules | PASS | 13/13 |
| CORS security | PASS | 6/6 |
| Database health controller | PASS | 2/2; live endpoint returned `200 {"status":"UP"}` |
| Frontend lint | PASS | 0 errors |
| TypeScript | PASS | `tsc --noEmit` |
| Production build | PASS | 24/24 routes generated |
| Browser console | PASS | No errors during the final run |
| Five responsive sizes | PASS | 390, 768, 1100, 1366, and 1600 px; no page-level horizontal overflow |

The two skipped backend tests are optional legacy bulk-fixture checks. They skip deterministically when the exact 105-readable-photo fixture is not installed; they are not product-code failures.

## Browser interaction results

- Database status showed **Database connected**.
- The five filters were present and functional: **All**, **Downloaded**, **Not downloaded**, **Edited**, and **Not edited**.
- **Advanced ZIP recovery** opened, required a reason, exposed Ready/ZIPped/date filters, and showed the `001_Name_City.png` naming rule.
- ZIP photo count showed `min=1` and no HTML maximum.
- The Edited checkbox was ticked and unticked on `KCZIP-20260811-E7085B`; both PATCH requests returned 200, the UI matched the database response, no error notice appeared, and the original unchecked state was restored.
- Download returned 200. The clicked ZIP stayed at row position 0 before and after download.
- No live ZIP was manually created or deleted during browser validation. Those destructive paths were exercised in isolated integration tests.

## Functional coverage

### Batch count and automatic queue

- Minimum photo count is 1; there is no business maximum.
- Changing the count with waiting photos requires **Finish current ZIP with old count** or **Apply new count now**.
- Emptying an old-count queue through manual recovery makes the next queue use the newly configured count.
- Approval commits first, then automatic ZIP work runs in bounded transactions; a scheduled retry resumes stranded work.
- Eligible photos have deterministic ordering by submission time and database ID.

### ZIP creation and content

- Manual recovery splits selections by the configured count and includes the final remainder.
- The old single-batch endpoint rejects an oversized selection.
- Missing, null, unreadable, corrupt, and oversized images cannot poison the queue.
- Archive photos are converted to real PNG and named `001_Name_City.png` through the final batch count.
- Original submissions and artwork remain unchanged while an active ZIP is retained.
- `submissions.csv` neutralizes spreadsheet-formula injection.

### Download, edit, and ordering

- Missing active archives rebuild from retained source photos when possible.
- Streaming uses a protected snapshot so cleanup cannot truncate an active download.
- Downloaded state is recorded only after the transfer succeeds.
- Download and live refresh preserve the visible row order.
- Edited true/false is pessimistically locked, persisted, and safely rolled back in the UI only when a request really fails.
- A successful “saved to the database” message is classified as success, not a false generic error.

### Retention, cleanup, and ZIP Bin

- Retention and warning periods are snapshotted when a ZIP is generated.
- Download does not restart retention.
- Migration V33 realigns legacy active rows so a 3-day setting no longer displays the old 10-day deadline.
- Expiry/manual deletion removes archive and artwork files while keeping sender, submission, member, telecast, and ZIP metadata.
- Deleted ZIP details move to the ZIP Bin.
- Failed filesystem cleanup stays visible as retryable cleanup-pending state and cannot be permanently cleared prematurely.
- Batch/submission locking and optimistic versions prevent concurrent mutation from resurrecting deleted data.

### Errors, security, and connectivity

- Admin failures are mapped to contextual, understandable messages; raw provider, SQL, port, and server exception text is not shown.
- Stale SSE clients cannot turn a committed Edited update into a false 500 response.
- Public and admin SSE channels are separated; public events do not expose internal UUIDs or admin actions.
- SSE reconnect uses bounded backoff.
- LAN API resolution works for localhost, loopback, and private-host clients while credentialed CORS requires the same trusted host.
- The frontend/backend default API port is consistently 8081.
- `/api/v1/health` now verifies the database and drives the header connection status.
- Upload size is consistently enforced from the admin setting through the public form and backend, with a 50 MB transport ceiling.
- Upload types are canonically limited to JPG, JPEG, and PNG across settings, public policy, storage, and migration V34.

## Responsive evidence

Screenshots were captured outside the repository so no generated test artifacts are included in Git:

- `390x844` phone
- `768x1024` tablet
- `1100x800` laptop
- `1366x900` desktop
- `1600x1000` monitor

All five showed ZIP retention, automatic queue, recovery, records, filter controls, and connected database status without page-level horizontal overflow.
