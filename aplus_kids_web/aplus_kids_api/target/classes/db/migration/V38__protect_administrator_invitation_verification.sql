ALTER TABLE administrator_memberships
    ADD COLUMN verification_failed_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN verification_locked_until TIMESTAMPTZ;

ALTER TABLE administrator_memberships
    ADD CONSTRAINT chk_administrator_verification_failed_attempts
    CHECK (verification_failed_attempts >= 0 AND verification_failed_attempts <= 5);

CREATE INDEX idx_administrator_verification_locked_until
    ON administrator_memberships(verification_locked_until)
    WHERE verification_locked_until IS NOT NULL;
