ALTER TABLE kids_champ_guest_contacts ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE INDEX idx_kc_guest_contacts_active ON kids_champ_guest_contacts(last_submitted_at DESC) WHERE deleted_at IS NULL;
