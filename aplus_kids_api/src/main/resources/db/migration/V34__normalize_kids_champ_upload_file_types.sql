UPDATE kids_champ_settings
SET allowed_file_types = 'JPG, JPEG, PNG';

ALTER TABLE kids_champ_settings
    ALTER COLUMN allowed_file_types SET DEFAULT 'JPG, JPEG, PNG';

ALTER TABLE kids_champ_settings
    ADD CONSTRAINT ck_kids_champ_settings_file_types
        CHECK (allowed_file_types = 'JPG, JPEG, PNG');
