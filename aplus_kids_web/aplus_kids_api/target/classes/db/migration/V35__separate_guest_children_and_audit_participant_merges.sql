CREATE TABLE kids_champ_guest_participants (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE,
    guest_contact_id BIGINT NOT NULL REFERENCES kids_champ_guest_contacts(id) ON DELETE RESTRICT,
    child_name VARCHAR(120) NOT NULL,
    normalized_child_name VARCHAR(120) NOT NULL,
    date_of_birth DATE NOT NULL,
    province VARCHAR(120) NOT NULL,
    hometown VARCHAR(120) NOT NULL,
    merged_into_reference UUID,
    merged_into_type VARCHAR(24),
    merged_at TIMESTAMPTZ,
    merged_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    merge_reason VARCHAR(600),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uq_kc_guest_participant_identity
        UNIQUE (guest_contact_id, normalized_child_name, date_of_birth),
    CONSTRAINT chk_kc_guest_participant_merge
        CHECK ((merged_at IS NULL AND merged_into_reference IS NULL AND merged_into_type IS NULL)
            OR (merged_at IS NOT NULL AND merged_into_reference IS NOT NULL AND merged_into_type IN ('GUEST', 'REGISTERED')))
);

INSERT INTO kids_champ_guest_participants
    (public_id, guest_contact_id, child_name, normalized_child_name, date_of_birth, province, hometown, created_at, updated_at)
SELECT gen_random_uuid(), guest_contact_id, child_name, normalized_child_name, date_of_birth, province, hometown,
       first_submitted_at, last_submitted_at
FROM (
    SELECT DISTINCT ON (s.guest_contact_id, lower(regexp_replace(trim(s.child_name), '\s+', ' ', 'g')), s.date_of_birth)
           s.guest_contact_id,
           s.child_name,
           lower(regexp_replace(trim(s.child_name), '\s+', ' ', 'g')) AS normalized_child_name,
           s.date_of_birth,
           s.province,
           s.hometown,
           MIN(s.submitted_at) OVER identity AS first_submitted_at,
           MAX(s.submitted_at) OVER identity AS last_submitted_at,
           s.submitted_at
    FROM kids_champ_submissions s
    WHERE s.guest_contact_id IS NOT NULL
    WINDOW identity AS (PARTITION BY s.guest_contact_id, lower(regexp_replace(trim(s.child_name), '\s+', ' ', 'g')), s.date_of_birth)
    ORDER BY s.guest_contact_id, lower(regexp_replace(trim(s.child_name), '\s+', ' ', 'g')), s.date_of_birth, s.submitted_at DESC, s.id DESC
) identities;

ALTER TABLE kids_champ_submissions
    ADD COLUMN guest_participant_id BIGINT REFERENCES kids_champ_guest_participants(id) ON DELETE RESTRICT;

UPDATE kids_champ_submissions s
SET guest_participant_id = participant.id
FROM kids_champ_guest_participants participant
WHERE s.guest_contact_id = participant.guest_contact_id
  AND lower(regexp_replace(trim(s.child_name), '\s+', ' ', 'g')) = participant.normalized_child_name
  AND s.date_of_birth = participant.date_of_birth;

ALTER TABLE kids_champ_submissions DROP CONSTRAINT chk_kc_submission_owner;
ALTER TABLE kids_champ_submissions ADD CONSTRAINT chk_kc_submission_owner CHECK (
    (user_id IS NOT NULL AND child_profile_id IS NOT NULL AND guest_contact_id IS NULL AND guest_participant_id IS NULL)
    OR (user_id IS NULL AND child_profile_id IS NULL AND guest_contact_id IS NOT NULL AND guest_participant_id IS NOT NULL)
);

CREATE INDEX idx_kc_guest_participants_contact
    ON kids_champ_guest_participants(guest_contact_id, merged_at, updated_at DESC);
CREATE INDEX idx_kc_submissions_guest_participant
    ON kids_champ_submissions(guest_participant_id, submitted_at DESC);

CREATE TABLE kids_champ_participant_merges (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE,
    source_guest_participant_id BIGINT NOT NULL REFERENCES kids_champ_guest_participants(id) ON DELETE RESTRICT,
    target_reference UUID NOT NULL,
    target_type VARCHAR(24) NOT NULL,
    reason VARCHAR(600) NOT NULL,
    matching_reasons TEXT,
    moved_submission_count INTEGER NOT NULL,
    merged_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    merged_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    undone_at TIMESTAMPTZ,
    undone_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    undo_reason VARCHAR(600),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_kc_participant_merge_target CHECK (target_type IN ('GUEST', 'REGISTERED')),
    CONSTRAINT chk_kc_participant_merge_count CHECK (moved_submission_count >= 0)
);

ALTER TABLE kids_champ_submissions
    ADD COLUMN last_participant_merge_id BIGINT REFERENCES kids_champ_participant_merges(id) ON DELETE SET NULL;

CREATE INDEX idx_kc_participant_merges_time ON kids_champ_participant_merges(merged_at DESC);
CREATE INDEX idx_kc_participant_merges_active ON kids_champ_participant_merges(undone_at) WHERE undone_at IS NULL;
CREATE INDEX idx_kc_submissions_last_participant_merge ON kids_champ_submissions(last_participant_merge_id)
    WHERE last_participant_merge_id IS NOT NULL;
