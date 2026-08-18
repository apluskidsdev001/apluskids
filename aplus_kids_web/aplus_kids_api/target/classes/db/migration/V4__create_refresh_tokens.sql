CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    token_family_id UUID NOT NULL,
    parent_token_id BIGINT REFERENCES refresh_tokens(id) ON DELETE SET NULL,
    replaced_by_token_id BIGINT REFERENCES refresh_tokens(id) ON DELETE SET NULL,
    remember_me BOOLEAN NOT NULL DEFAULT FALSE,
    device_label VARCHAR(120),
    issued_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revocation_reason VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_refresh_expiry CHECK (expires_at > issued_at)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens (token_family_id);
CREATE INDEX idx_refresh_tokens_expiry ON refresh_tokens (expires_at);
