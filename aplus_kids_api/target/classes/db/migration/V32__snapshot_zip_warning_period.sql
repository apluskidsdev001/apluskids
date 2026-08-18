ALTER TABLE kids_champ_batches
    ADD COLUMN warning_days INTEGER;

UPDATE kids_champ_batches AS batch
SET warning_days = LEAST(
    GREATEST(settings.zip_warning_days, 0),
    GREATEST(batch.retention_days - 1, 0)
)
FROM kids_champ_settings AS settings
WHERE settings.id = 1;

ALTER TABLE kids_champ_batches
    ALTER COLUMN warning_days SET NOT NULL,
    ADD CONSTRAINT chk_kc_batch_warning_days
    CHECK (warning_days >= 0 AND warning_days < retention_days);
