CREATE TABLE kids_champ_ignored_guest_matches (
    id BIGSERIAL PRIMARY KEY,
    first_guest_id UUID NOT NULL,
    second_guest_id UUID NOT NULL,
    ignored_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ignored_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_kids_champ_ignored_guest_pair UNIQUE (first_guest_id, second_guest_id),
    CONSTRAINT chk_kids_champ_ignored_guest_order CHECK (first_guest_id::text < second_guest_id::text)
);

