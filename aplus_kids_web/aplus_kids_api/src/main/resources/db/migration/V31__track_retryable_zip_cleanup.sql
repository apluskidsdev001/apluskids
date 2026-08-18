ALTER TABLE kids_champ_batches
    ADD COLUMN cleanup_pending BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN cleanup_failure_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN last_cleanup_attempt_at TIMESTAMPTZ;

ALTER TABLE kids_champ_batches
    ADD CONSTRAINT chk_kc_batch_cleanup_failure_count
    CHECK (cleanup_failure_count >= 0);

CREATE INDEX idx_kc_batches_cleanup_pending
    ON kids_champ_batches(id)
    WHERE cleanup_pending = TRUE;
