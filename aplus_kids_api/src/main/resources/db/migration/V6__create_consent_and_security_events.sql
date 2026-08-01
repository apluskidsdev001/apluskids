CREATE TABLE consent_records (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(48) NOT NULL,
    policy_version VARCHAR(40) NOT NULL,
    accepted BOOLEAN NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    source VARCHAR(40) NOT NULL DEFAULT 'WEB_REGISTRATION',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_consent_type CHECK (
        consent_type IN ('PARENT_GUARDIAN_ATTESTATION', 'TERMS_OF_USE', 'PRIVACY_POLICY')
    )
);

CREATE INDEX idx_consent_records_user ON consent_records (user_id);
CREATE INDEX idx_consent_records_type_version ON consent_records (consent_type, policy_version);

CREATE TABLE security_events (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(64) NOT NULL,
    outcome VARCHAR(24) NOT NULL,
    request_id VARCHAR(80),
    ip_hash VARCHAR(128),
    user_agent_summary VARCHAR(200),
    metadata JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_security_events_user_time ON security_events (user_id, occurred_at DESC);
CREATE INDEX idx_security_events_type_time ON security_events (event_type, occurred_at DESC);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE,
    actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    target_type VARCHAR(60) NOT NULL,
    target_public_id UUID,
    action VARCHAR(80) NOT NULL,
    outcome VARCHAR(24) NOT NULL,
    request_id VARCHAR(80),
    metadata JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_actor_time ON audit_logs (actor_user_id, occurred_at DESC);
CREATE INDEX idx_audit_logs_target ON audit_logs (target_type, target_public_id);
