CREATE TABLE IF NOT EXISTS workouts (
    value TEXT,
    start TEXT AS (json_extract(value, '$.start') )
);

CREATE INDEX IF NOT EXISTS workouts_start
on workouts(start);
