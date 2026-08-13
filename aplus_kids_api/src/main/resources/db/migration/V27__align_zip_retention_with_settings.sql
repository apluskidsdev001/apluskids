UPDATE kids_champ_batches AS batch
SET delete_after = batch.first_downloaded_at + make_interval(days => settings.zip_expiry_days)
FROM kids_champ_settings AS settings
WHERE settings.id = 1
  AND batch.first_downloaded_at IS NOT NULL
  AND batch.deleted_at IS NULL;
