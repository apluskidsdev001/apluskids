ALTER TABLE kids_champ_batches
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE kids_champ_batches
    ALTER COLUMN version DROP DEFAULT;
