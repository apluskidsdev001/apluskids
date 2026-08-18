ALTER TABLE kids_champ_guest_contacts
    ADD COLUMN claimed_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN claimed_at TIMESTAMPTZ;

CREATE TABLE kids_champ_message_campaigns (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE,
    channel VARCHAR(20) NOT NULL,
    message_template VARCHAR(1000) NOT NULL,
    status VARCHAR(24) NOT NULL,
    recipient_count INTEGER NOT NULL DEFAULT 0,
    created_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    queued_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    CONSTRAINT chk_kc_campaign_channel CHECK (channel IN ('WHATSAPP', 'EMAIL')),
    CONSTRAINT chk_kc_campaign_status CHECK (status IN ('DRAFT', 'QUEUED', 'COMPLETED', 'PARTIAL', 'FAILED'))
);

CREATE TABLE kids_champ_message_recipients (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL REFERENCES kids_champ_message_campaigns(id) ON DELETE CASCADE,
    participant_reference UUID NOT NULL,
    participant_name VARCHAR(120) NOT NULL,
    destination VARCHAR(254) NOT NULL,
    rendered_message VARCHAR(1200) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'QUEUED',
    attempts INTEGER NOT NULL DEFAULT 0,
    provider_message_id VARCHAR(160),
    failure_reason VARCHAR(600),
    sent_at TIMESTAMPTZ,
    UNIQUE(campaign_id, participant_reference),
    CONSTRAINT chk_kc_recipient_status CHECK (status IN ('QUEUED', 'SENDING', 'SENT', 'FAILED', 'SKIPPED'))
);

CREATE INDEX idx_kc_campaign_created ON kids_champ_message_campaigns(created_at DESC);
CREATE INDEX idx_kc_recipients_campaign_status ON kids_champ_message_recipients(campaign_id, status);
