ALTER TABLE kids_champ_message_campaigns
    DROP CONSTRAINT IF EXISTS chk_kc_campaign_status,
    ADD COLUMN IF NOT EXISTS name VARCHAR(160),
    ADD COLUMN IF NOT EXISTS source VARCHAR(40) NOT NULL DEFAULT 'MANUAL',
    ADD COLUMN IF NOT EXISTS template_name VARCHAR(120),
    ADD COLUMN IF NOT EXISTS language_code VARCHAR(20),
    ADD CONSTRAINT chk_kc_campaign_status
        CHECK (status IN ('DRAFT', 'QUEUED', 'SENDING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED'));

ALTER TABLE kids_champ_message_recipients
    DROP CONSTRAINT IF EXISTS chk_kc_recipient_status,
    ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
    ADD CONSTRAINT chk_kc_recipient_status
        CHECK (status IN ('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'SKIPPED', 'DELETED'));

CREATE INDEX IF NOT EXISTS idx_kc_recipients_delivery_queue
    ON kids_champ_message_recipients(status, next_attempt_at, id);

CREATE TABLE kids_champ_whatsapp_preferences (
    participant_reference UUID PRIMARY KEY,
    status VARCHAR(16) NOT NULL,
    source VARCHAR(40) NOT NULL,
    reason VARCHAR(300),
    opted_in_at TIMESTAMPTZ,
    opted_out_at TIMESTAMPTZ,
    updated_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_kc_whatsapp_preference_status
        CHECK (status IN ('UNKNOWN', 'OPTED_IN', 'OPTED_OUT'))
);

INSERT INTO kids_champ_whatsapp_preferences
    (participant_reference, status, source, opted_in_at, updated_at)
SELECT participant_reference,
       'OPTED_IN',
       'SUBMISSION',
       MIN(whatsapp_consent_at),
       CURRENT_TIMESTAMP
FROM (
    SELECT COALESCE(cp.public_id, gc.public_id) AS participant_reference,
           s.whatsapp_consent_at
    FROM kids_champ_submissions s
    LEFT JOIN child_profiles cp ON cp.id = s.child_profile_id
    LEFT JOIN kids_champ_guest_contacts gc ON gc.id = s.guest_contact_id
    WHERE s.whatsapp_consent_at IS NOT NULL
) consented
WHERE participant_reference IS NOT NULL
GROUP BY participant_reference
ON CONFLICT (participant_reference) DO NOTHING;

CREATE TABLE kids_champ_whatsapp_templates (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE,
    meta_template_id VARCHAR(80),
    name VARCHAR(120) NOT NULL,
    language_code VARCHAR(20) NOT NULL,
    category VARCHAR(40) NOT NULL,
    status VARCHAR(24) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    variables TEXT,
    disabled BOOLEAN NOT NULL DEFAULT FALSE,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, language_code)
);

CREATE INDEX idx_kc_whatsapp_templates_status
    ON kids_champ_whatsapp_templates(status, language_code);

CREATE TABLE kids_champ_message_delivery_events (
    id BIGSERIAL PRIMARY KEY,
    recipient_id BIGINT NOT NULL REFERENCES kids_champ_message_recipients(id) ON DELETE CASCADE,
    status VARCHAR(24) NOT NULL,
    provider_status VARCHAR(40),
    attempt INTEGER NOT NULL DEFAULT 0,
    details VARCHAR(600),
    provider_timestamp TIMESTAMPTZ,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kc_delivery_events_recipient
    ON kids_champ_message_delivery_events(recipient_id, occurred_at, id);
