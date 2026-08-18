CREATE TABLE account_deletion_confirmations (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    requested_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_references TEXT NOT NULL,
    target_count INTEGER NOT NULL,
    selection_hash VARCHAR(64) NOT NULL,
    code_hash VARCHAR(64) NOT NULL UNIQUE,
    issued_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    consumed_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_account_deletion_confirmation_count CHECK (target_count BETWEEN 1 AND 100),
    CONSTRAINT chk_account_deletion_confirmation_attempts CHECK (failed_attempts BETWEEN 0 AND 5),
    CONSTRAINT chk_account_deletion_confirmation_expiry CHECK (expires_at > issued_at)
);

CREATE INDEX idx_account_deletion_confirmations_requester
    ON account_deletion_confirmations(requested_by_user_id, issued_at DESC);

CREATE INDEX idx_account_deletion_confirmations_expiry
    ON account_deletion_confirmations(expires_at)
    WHERE consumed_at IS NULL AND revoked_at IS NULL;
