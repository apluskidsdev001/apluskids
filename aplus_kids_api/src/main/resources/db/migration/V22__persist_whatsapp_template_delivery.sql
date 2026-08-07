ALTER TABLE kids_champ_message_recipients
    ADD COLUMN IF NOT EXISTS template_name VARCHAR(120);

ALTER TABLE kids_champ_message_recipients
    ADD COLUMN IF NOT EXISTS template_language_code VARCHAR(20);

ALTER TABLE kids_champ_message_recipients
    ADD COLUMN IF NOT EXISTS template_parameters TEXT;
