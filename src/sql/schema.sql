DROP TABLE IF EXISTS job_queue;

CREATE TABLE IF NOT EXISTS jobs(
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    run_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_jobs ON jobs (name, status, run_at)