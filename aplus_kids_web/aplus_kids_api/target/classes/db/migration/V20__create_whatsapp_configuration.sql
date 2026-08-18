CREATE TABLE kids_champ_whatsapp_config (
    id SMALLINT PRIMARY KEY,
    graph_api_version VARCHAR(20) NOT NULL,
    phone_number_id VARCHAR(40) NOT NULL,
    business_account_id VARCHAR(40) NOT NULL,
    access_token_encrypted TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_test_status VARCHAR(24),
    last_test_message VARCHAR(600),
    last_tested_at TIMESTAMPTZ
);
