CREATE TABLE advertisements (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL,
    content_type VARCHAR(24) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'DRAFT',
    title VARCHAR(180),
    description TEXT,
    button_label VARCHAR(80),
    alt_text VARCHAR(300),
    destination_url VARCHAR(2048),
    open_new_tab BOOLEAN NOT NULL DEFAULT TRUE,
    fit_mode VARCHAR(16) NOT NULL DEFAULT 'CONTAIN',
    background_color VARCHAR(16) NOT NULL DEFAULT '#FFFFFF',
    desktop_filename VARCHAR(255),
    desktop_original_name VARCHAR(255),
    desktop_media_type VARCHAR(100),
    mobile_filename VARCHAR(255),
    mobile_original_name VARCHAR(255),
    mobile_media_type VARCHAR(100),
    external_source_url VARCHAR(2048),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    priority INTEGER NOT NULL DEFAULT 0,
    rotation_weight INTEGER NOT NULL DEFAULT 1,
    impression_count BIGINT NOT NULL DEFAULT 0,
    click_count BIGINT NOT NULL DEFAULT 0,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT advertisements_content_type_check CHECK (content_type IN ('IMAGE','GIF','VIDEO','CARD','EMBED')),
    CONSTRAINT advertisements_status_check CHECK (status IN ('DRAFT','ACTIVE','PAUSED','ARCHIVED')),
    CONSTRAINT advertisements_fit_mode_check CHECK (fit_mode IN ('CONTAIN','COVER')),
    CONSTRAINT advertisements_dates_check CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at),
    CONSTRAINT advertisements_rotation_check CHECK (rotation_weight BETWEEN 1 AND 100)
);

CREATE TABLE advertisement_placements (
    id BIGSERIAL PRIMARY KEY,
    advertisement_id BIGINT NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
    slot_key VARCHAR(80) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(advertisement_id, slot_key),
    CONSTRAINT advertisement_slot_check CHECK (slot_key IN (
        'HOME_AFTER_HERO','HOME_AFTER_SHORTCUTS','HOME_BEFORE_SCHEDULE',
        'KIDS_ZONE_AFTER_HERO','WATCH_BEFORE_CATEGORIES','MARKET_PROMO_BANNER'
    ))
);

CREATE TABLE advertisement_audit_history (
    id BIGSERIAL PRIMARY KEY,
    advertisement_id BIGINT REFERENCES advertisements(id) ON DELETE SET NULL,
    advertisement_public_id UUID NOT NULL,
    actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(80) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_advertisements_public_schedule ON advertisements(status, starts_at, ends_at) WHERE archived_at IS NULL;
CREATE INDEX idx_advertisement_placements_slot ON advertisement_placements(slot_key, advertisement_id);
CREATE INDEX idx_advertisement_audit_created ON advertisement_audit_history(created_at DESC);

INSERT INTO advertisements(public_id,name,content_type,status,alt_text,external_source_url,fit_mode,background_color,priority,rotation_weight)
VALUES ('00000000-0000-4000-8000-000000000040','Existing Market promotion','IMAGE','ACTIVE','Market advertisement','/images/market/advertisements/Advertisement1.png','COVER','#FFFFFF',100,1);

INSERT INTO advertisement_placements(advertisement_id,slot_key)
SELECT id,'MARKET_PROMO_BANNER' FROM advertisements WHERE public_id='00000000-0000-4000-8000-000000000040';
