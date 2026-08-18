CREATE TABLE kids_champ_guest_contacts (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE,
    phone_e164 VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(254),
    parent_name VARCHAR(120) NOT NULL,
    country_code CHAR(2) NOT NULL,
    province VARCHAR(120) NOT NULL,
    hometown VARCHAR(120) NOT NULL,
    submission_count INTEGER NOT NULL DEFAULT 0,
    first_submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_kc_guest_submission_count CHECK (submission_count >= 0)
);

CREATE TABLE kids_champ_batches (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE,
    batch_code VARCHAR(32) NOT NULL UNIQUE,
    status VARCHAR(24) NOT NULL,
    photo_count INTEGER NOT NULL DEFAULT 0,
    archive_path VARCHAR(500),
    first_downloaded_at TIMESTAMPTZ,
    delete_after TIMESTAMPTZ,
    telecast_date DATE,
    alternate_telecast_date DATE,
    created_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    deleted_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_kc_batch_status CHECK (status IN ('READY', 'DOWNLOADED', 'DELETED')),
    CONSTRAINT chk_kc_batch_photo_count CHECK (photo_count >= 0)
);

CREATE TABLE kids_champ_submissions (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE,
    tracking_code VARCHAR(32) NOT NULL UNIQUE,
    user_id BIGINT REFERENCES users(id) ON DELETE RESTRICT,
    child_profile_id BIGINT REFERENCES child_profiles(id) ON DELETE RESTRICT,
    guest_contact_id BIGINT REFERENCES kids_champ_guest_contacts(id) ON DELETE RESTRICT,
    child_name VARCHAR(120) NOT NULL,
    date_of_birth DATE NOT NULL,
    age_at_submission INTEGER NOT NULL,
    parent_name VARCHAR(120) NOT NULL,
    email VARCHAR(254),
    phone_e164 VARCHAR(20) NOT NULL,
    country_code CHAR(2) NOT NULL,
    province VARCHAR(120) NOT NULL,
    hometown VARCHAR(120) NOT NULL,
    work_title VARCHAR(160),
    work_description VARCHAR(1000),
    review_status VARCHAR(24) NOT NULL,
    rejection_reason VARCHAR(600),
    telecast_status VARCHAR(24) NOT NULL,
    batch_id BIGINT REFERENCES kids_champ_batches(id) ON DELETE RESTRICT,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255),
    media_type VARCHAR(80) NOT NULL,
    file_size BIGINT NOT NULL,
    consent_accepted_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMPTZ,
    reviewed_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    photo_deleted_at TIMESTAMPTZ,
    photo_deleted_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_kc_submission_owner CHECK (
        (user_id IS NOT NULL AND child_profile_id IS NOT NULL AND guest_contact_id IS NULL)
        OR (user_id IS NULL AND child_profile_id IS NULL AND guest_contact_id IS NOT NULL)
    ),
    CONSTRAINT chk_kc_child_age CHECK (age_at_submission BETWEEN 0 AND 17),
    CONSTRAINT chk_kc_file_size CHECK (file_size > 0),
    CONSTRAINT chk_kc_review_status CHECK (
        review_status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED')
    ),
    CONSTRAINT chk_kc_telecast_status CHECK (
        telecast_status IN ('NOT_SELECTED', 'SELECTED', 'SCHEDULED', 'TELECASTED', 'CANCELLED')
    )
);

CREATE INDEX idx_kc_submissions_user ON kids_champ_submissions(user_id, submitted_at DESC);
CREATE INDEX idx_kc_submissions_guest ON kids_champ_submissions(guest_contact_id, submitted_at DESC);
CREATE INDEX idx_kc_submissions_review ON kids_champ_submissions(review_status, submitted_at);
CREATE INDEX idx_kc_submissions_unbatched ON kids_champ_submissions(submitted_at)
    WHERE batch_id IS NULL AND review_status = 'APPROVED' AND photo_deleted_at IS NULL;
CREATE INDEX idx_kc_batches_retention ON kids_champ_batches(delete_after)
    WHERE deleted_at IS NULL AND delete_after IS NOT NULL;

CREATE TABLE kids_champ_audit_log (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(40) NOT NULL,
    entity_public_id UUID NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kc_audit_entity ON kids_champ_audit_log(entity_type, entity_public_id, created_at DESC);
