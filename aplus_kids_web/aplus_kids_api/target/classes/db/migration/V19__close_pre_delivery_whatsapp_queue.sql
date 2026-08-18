-- Campaigns created before Cloud API delivery existed were audit-only records.
-- Do not send those historical test messages when delivery is enabled for the first time.
UPDATE kids_champ_message_recipients
SET status = 'SKIPPED',
    failure_reason = 'Closed during WhatsApp Cloud API activation.'
WHERE status IN ('QUEUED', 'SENDING');

UPDATE kids_champ_message_campaigns
SET status = 'FAILED',
    completed_at = CURRENT_TIMESTAMP
WHERE status = 'QUEUED';
