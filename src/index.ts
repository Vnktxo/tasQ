import express from 'express';
import { PostgresQueue } from './queue';
import { pool } from './db';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

const app = express();
app.use(express.json());

const emailQueue = new PostgresQueue('email_queue');

// Configure Email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 1. API
app.post('/jobs', async (req, res) => {
    try {
        const { email, subject, body, delay } = req.body;
        const job = await emailQueue.add({ email, subject, body }, delay || 0);
        res.json({ status: 'queued', jobId: job.id });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/stats', async (req, res) => {
    try {
        const stats = await emailQueue.getStats();
        res.json({
            queue: 'email_queue',
            timestamp: new Date(),
            stats: stats
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// 2. WORKER
let isShuttingDown = false;
let isWorking = false;

const startWorker = async () => {
    console.log('👷 Worker started...');

    while (!isShuttingDown) {
        let job = null;
        try {
            job = await emailQueue.poll();

            if (!job) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
            }

            isWorking = true;
            console.log(`[Worker] Processing job ${job.id} (Attempt ${job.attempts})...`);
            
            // Simulate work (so you can see the delay)
            await new Promise(r => setTimeout(r, 2000));

            // Send Real Email
            await transporter.sendMail({
                from: '"Task Queue Bot" <vnktesh14@gmail.com>', // Fixed typo
                to: job.payload.email,
                subject: job.payload.subject,
                text: job.payload.body
            });

            await emailQueue.complete(job.id);
            console.log(`[Worker] Job ${job.id} COMPLETED.`);

        } catch (err: any) {
            console.error(`[Worker] Job Failed:`, err.message);
            if (job) {
                await emailQueue.handleFailure(job, err);
            }
        } finally {
            isWorking = false;
        }
    }
    console.log("zzz Worker loop exited zzz");
};

// 3. STARTUP
// Added 'async' here so we can await recoverJobs
const server = app.listen(process.env.PORT || 3000, async () => {
    console.log('🚀 Server running on port', process.env.PORT || 3000);
    // Recover jobs from previous crash
    await emailQueue.recoverJobs(5);
    startWorker();
});

// 4. SHUTDOWN
// Added 'async' and 'signal' argument
const gracefulShutdown = async (signal: string) => {
    console.log(`\n${signal} received: Starting graceful shutdown...`);
    isShuttingDown = true;

    // Stop HTTP server
    server.close(() => {
        console.log('HTTP server closed bhaii...');
    });

    // Wait for active job
    if (isWorking) {
        console.log('Waiting for active job to finish...');
        while (isWorking) {
            await new Promise(r => setTimeout(r, 100));
        }
    }

    console.log('Closing database connection...');
    await pool.end();

    console.log('✅ Shutdown complete. Goodbye.');
    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));