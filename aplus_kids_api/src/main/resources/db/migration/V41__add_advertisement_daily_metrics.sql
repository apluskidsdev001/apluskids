CREATE TABLE advertisement_daily_metrics (
    id BIGSERIAL PRIMARY KEY,
    advertisement_id BIGINT NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    impressions BIGINT NOT NULL DEFAULT 0,
    clicks BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(advertisement_id, metric_date),
    CONSTRAINT advertisement_daily_metrics_non_negative CHECK (impressions >= 0 AND clicks >= 0)
);

CREATE INDEX idx_advertisement_daily_metrics_date
    ON advertisement_daily_metrics(metric_date, advertisement_id);

-- Preserve the counters collected before daily tracking was introduced.
INSERT INTO advertisement_daily_metrics(advertisement_id, metric_date, impressions, clicks)
SELECT id, CURRENT_DATE, impression_count, click_count
FROM advertisements
WHERE impression_count > 0 OR click_count > 0;
