ALTER TABLE kids_champ_settings
    ADD COLUMN active_zip_target_size INTEGER,
    ADD COLUMN active_zip_started_at TIMESTAMPTZ;

ALTER TABLE kids_champ_settings
    ADD CONSTRAINT chk_kc_active_zip_target
    CHECK (active_zip_target_size IS NULL OR active_zip_target_size BETWEEN 1 AND 500);

