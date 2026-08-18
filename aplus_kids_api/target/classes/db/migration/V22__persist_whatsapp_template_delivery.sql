ALTER TABLE kids_champ_message_recipients
    ADD COLUMN template_name VARCHAR(120),
    ADD COLUMN template_language_code VARCHAR(20),
    ADD COLUMN template_parameters TEXT;
