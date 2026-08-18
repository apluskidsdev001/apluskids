ALTER TABLE kids_champ_batches
    ADD COLUMN retention_days INTEGER;

UPDATE kids_champ_batches AS batch
SET retention_days = settings.zip_expiry_days
FROM kids_champ_settings AS settings
WHERE settings.id = 1;

ALTER TABLE kids_champ_batches
    ALTER COLUMN retention_days SET NOT NULL,
    ADD CONSTRAINT chk_kc_batch_retention_days CHECK (retention_days >= 1);

UPDATE kids_champ_batches
SET delete_after = created_at + make_interval(days => retention_days)
WHERE deleted_at IS NULL
  AND delete_after IS NULL;

CREATE INDEX idx_kc_submissions_zip_eligible
    ON kids_champ_submissions(submitted_at, id)
    WHERE deleted_at IS NULL
      AND batch_id IS NULL
      AND review_status = 'APPROVED'
      AND photo_deleted_at IS NULL
      AND stored_filename IS NOT NULL;
