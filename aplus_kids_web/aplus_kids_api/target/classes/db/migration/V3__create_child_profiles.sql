CREATE TABLE child_profiles (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    full_name VARCHAR(120) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(32) NOT NULL,
    country_code CHAR(2) NOT NULL,
    province VARCHAR(120) NOT NULL,
    hometown VARCHAR(120) NOT NULL,
    address VARCHAR(300),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_child_gender CHECK (
        gender IN ('GIRL', 'BOY', 'PREFER_NOT_TO_SAY')
    ),
    CONSTRAINT chk_child_dob_not_future CHECK (date_of_birth <= CURRENT_DATE)
);

CREATE INDEX idx_child_profiles_user_id ON child_profiles (user_id);
CREATE INDEX idx_child_profiles_active_user ON child_profiles (user_id) WHERE deleted_at IS NULL;
