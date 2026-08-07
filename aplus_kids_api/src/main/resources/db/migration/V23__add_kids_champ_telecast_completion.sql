ALTER TABLE kids_champ_batches
    ADD COLUMN IF NOT EXISTS telecast_completed_at TIMESTAMPTZ;
