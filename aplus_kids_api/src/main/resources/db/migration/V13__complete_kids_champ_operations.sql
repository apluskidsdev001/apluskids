ALTER TABLE kids_champ_submissions
    ADD COLUMN category VARCHAR(40) NOT NULL DEFAULT 'Drawing',
    ADD COLUMN file_status VARCHAR(24) NOT NULL DEFAULT 'READY',
    ADD COLUMN assigned_reviewer_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN internal_note VARCHAR(1000),
    ADD COLUMN deleted_at TIMESTAMPTZ,
    ADD COLUMN deleted_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE kids_champ_submissions
    ADD CONSTRAINT chk_kc_submission_file_status
    CHECK (file_status IN ('READY', 'MISSING', 'PROCESSING_FAILED'));

CREATE INDEX idx_kc_submissions_active_submitted
    ON kids_champ_submissions(submitted_at DESC)
    WHERE deleted_at IS NULL;

CREATE TABLE kids_champ_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    categories TEXT NOT NULL DEFAULT 'Drawing,Painting,Handcraft',
    max_file_size_mb INTEGER NOT NULL DEFAULT 8,
    allowed_file_types VARCHAR(120) NOT NULL DEFAULT 'JPG,JPEG,PNG',
    minimum_age INTEGER NOT NULL DEFAULT 0,
    maximum_age INTEGER NOT NULL DEFAULT 17,
    daily_telecast_limit INTEGER NOT NULL DEFAULT 12,
    default_telecast_time TIME NOT NULL DEFAULT '15:00',
    zip_batch_size INTEGER NOT NULL DEFAULT 100,
    zip_expiry_days INTEGER NOT NULL DEFAULT 10,
    zip_warning_days INTEGER NOT NULL DEFAULT 2,
    frequent_participant_threshold INTEGER NOT NULL DEFAULT 4,
    require_whatsapp_consent BOOLEAN NOT NULL DEFAULT TRUE,
    campaign_limit INTEGER NOT NULL DEFAULT 250,
    default_message VARCHAR(1000) NOT NULL DEFAULT 'Hello {name}, thank you for being part of A+ Kids Champ. Reference: {reference}.',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO kids_champ_settings(id) VALUES (1);

CREATE TABLE kids_champ_calendar_tasks (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE,
    task_date DATE NOT NULL,
    title VARCHAR(180) NOT NULL,
    details VARCHAR(1000),
    completed_at TIMESTAMPTZ,
    created_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_kc_calendar_active_date
    ON kids_champ_calendar_tasks(task_date)
    WHERE deleted_at IS NULL;
