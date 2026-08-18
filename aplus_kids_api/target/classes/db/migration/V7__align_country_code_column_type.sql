ALTER TABLE child_profiles
    ALTER COLUMN country_code TYPE VARCHAR(2)
    USING TRIM(country_code);
