UPDATE kids_champ_batches
SET delete_after = CASE
    WHEN delete_after IS NULL
        THEN created_at + make_interval(days => retention_days)
    ELSE LEAST(
        delete_after,
        created_at + make_interval(days => retention_days)
    )
END
WHERE deleted_at IS NULL;
