ALTER TABLE kids_champ_settings
    DROP CONSTRAINT IF EXISTS chk_kc_active_zip_target;

ALTER TABLE kids_champ_settings
    ADD CONSTRAINT chk_kc_active_zip_target
    CHECK (active_zip_target_size IS NULL OR active_zip_target_size >= 1);
