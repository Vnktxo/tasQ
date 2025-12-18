import { query } from "../db";

export interface Job {
    id: number;
    name: string;
    payload: any;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    run_at: Date;
    attempts: number;      // <--- Added these so TypeScript doesn't complain
    max_attempts: number;
}

export class PostgresQueue {
    private queueName: string;

    constructor(queueName: string) {
        this.queueName = queueName;
    }

    // 1. ADD JOB
    async add(payload: any, delaySeconds: number = 0) {
        const sql = `
            INSERT INTO jobs (name, payload, run_at)
            VALUES (
                $1, 
                $2, 
                NOW() + make_interval(secs => $3)
            ) 
            RETURNING id;
        `;

        const res = await query(sql, [this.queueName, payload, delaySeconds]);
        console.log(`[Producer] Job ${res.rows[0].id} added to ${this.queueName}`);
        return res.rows[0];
    }

    // 2. POLL JOB
    async poll() {
        const sql = `
            UPDATE jobs
            SET status = 'processing',
                updated_at = NOW(),
                attempts = attempts + 1
            WHERE id = (
                SELECT id FROM jobs
                WHERE name = $1
                  AND status = 'pending'
                  AND run_at <= NOW()
                ORDER BY run_at ASC
                FOR UPDATE SKIP LOCKED
                LIMIT 1
            )
            RETURNING *;`;
            
        const res = await query(sql, [this.queueName]);
        return res.rows[0] || null;
    }

    // 3. HANDLE FAILURE (Smart Retry)
    async handleFailure(job: Job, err: Error) {
        const sql = `
            UPDATE jobs
            SET 
                status = CASE 
                    WHEN attempts < max_attempts THEN 'pending' 
                    ELSE 'failed' 
                END,
                -- Exponential Backoff: Wait 2^attempts seconds
                run_at = CASE 
                    WHEN attempts < max_attempts THEN NOW() + (power(2, attempts) * INTERVAL '1 second')
                    ELSE run_at 
                END,
                last_error = $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING status, run_at;
        `;

        const res = await query(sql, [err.message, job.id]);
        const updated = res.rows[0];
        console.log(`[Worker] Job ${job.id} handled. Status: ${updated.status}. Next run: ${updated.run_at}`);
    }

    // 4. COMPLETE JOB
    async complete(jobID: number) {
        await query(
            "UPDATE jobs SET status = 'completed', updated_at = NOW() WHERE id = $1",
            [jobID]
        );
    }

    // 5. RECOVER ZOMBIES (Crash Recovery)
    async recoverJobs(minutes: number = 5) {
        const sql = `
            UPDATE jobs
            SET status = 'pending',
                updated_at = NOW(),
                attempts = attempts + 1,
                last_error = 'Recovered from zombie state'
            WHERE status = 'processing'
              AND updated_at < NOW() - make_interval(mins => $1)
            RETURNING id;
        `;
        
        const res = await query(sql, [minutes]);
        if (res.rowCount && res.rowCount > 0) {
            console.log(`[🚑 Recovery] Reset ${res.rowCount} zombie jobs to pending.`);
        }
    }

    // 6. DASHBOARD STATS
    async getStats() {
        const sql = `
            SELECT status, COUNT(*) as count 
            FROM jobs 
            GROUP BY status;
        `;
        const res = await query(sql);
        
        const stats: any = { pending: 0, processing: 0, completed: 0, failed: 0 };
        res.rows.forEach(row => {
            stats[row.status] = parseInt(row.count);
        });
        return stats;
    }
}