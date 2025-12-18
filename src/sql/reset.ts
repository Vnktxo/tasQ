import { query, pool } from '../db';

const reset = async () => {
  try {
    console.log('💥 Dropping old tables...');
    // We drop both possible table names to be safe
    await query('DROP TABLE IF EXISTS job_queue;');
    await query('DROP TABLE IF EXISTS jobs;');

    console.log('🏗️ Creating new "jobs" table...');
    const createTable = `
      CREATE TABLE jobs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        run_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        attempts INT NOT NULL DEFAULT 0,  -- This is the column your code wants!
        max_attempts INT NOT NULL DEFAULT 3,
        last_error TEXT
      );
    `;
    await query(createTable);

    console.log('⚡ Creating indexes...');
    await query('CREATE INDEX idx_jobs_poll ON jobs (name, status, run_at);');

    console.log('✅ Database Reset Complete!');
  } catch (err) {
    console.error('❌ Reset Failed:', err);
  } finally {
    await pool.end();
  }
};

reset();