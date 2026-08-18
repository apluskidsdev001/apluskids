CREATE TABLE administrator_memberships (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    invited_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    invite_reason VARCHAR(600),
    invited_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMPTZ,
    suspended_at TIMESTAMPTZ,
    suspended_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    suspension_reason VARCHAR(600),
    cancelled_at TIMESTAMPTZ,
    cancelled_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_administrator_membership_role CHECK (role IN ('ADMIN', 'SUPER_ADMIN')),
    CONSTRAINT chk_administrator_membership_status CHECK (
        status IN ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'CANCELLED')
    )
);

CREATE INDEX idx_administrator_memberships_status ON administrator_memberships(status);
CREATE INDEX idx_administrator_memberships_role_status ON administrator_memberships(role, status);

INSERT INTO administrator_memberships (user_id, role, status, activated_at)
SELECT DISTINCT
    u.id,
    CASE WHEN EXISTS (
        SELECT 1 FROM user_roles ur2
        JOIN roles r2 ON r2.id = ur2.role_id
        WHERE ur2.user_id = u.id AND r2.name = 'ROLE_SUPER_ADMIN'
    ) THEN 'SUPER_ADMIN' ELSE 'ADMIN' END,
    CASE WHEN u.status = 'ACTIVE' THEN 'ACTIVE' ELSE 'SUSPENDED' END,
    COALESCE(u.email_verified_at, u.created_at)
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
WHERE r.name IN ('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')
ON CONFLICT (user_id) DO NOTHING;
