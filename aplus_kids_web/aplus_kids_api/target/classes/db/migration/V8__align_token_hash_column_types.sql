ALTER TABLE email_verification_tokens
    ALTER COLUMN token_hash TYPE VARCHAR(64) USING TRIM(token_hash);

ALTER TABLE password_reset_tokens
    ALTER COLUMN token_hash TYPE VARCHAR(64) USING TRIM(token_hash);

ALTER TABLE refresh_tokens
    ALTER COLUMN token_hash TYPE VARCHAR(64) USING TRIM(token_hash);
