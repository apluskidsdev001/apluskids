ALTER TABLE administrator_memberships
    ADD COLUMN removed_at TIMESTAMPTZ,
    ADD COLUMN removed_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN removal_reason VARCHAR(600);

ALTER TABLE administrator_memberships
    DROP CONSTRAINT chk_administrator_membership_status;

ALTER TABLE administrator_memberships
    ADD CONSTRAINT chk_administrator_membership_status CHECK (
        status IN ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'REMOVED')
    );

CREATE INDEX idx_administrator_memberships_removed_at
    ON administrator_memberships(removed_at)
    WHERE removed_at IS NOT NULL;
