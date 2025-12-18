# TypeScript Distributed Task Queue

A robust, fault-tolerant asynchronous task queue built from scratch using **Node.js**, **TypeScript**, and **PostgreSQL**.

Unlike Redis-based queues, this system leverages Postgres `SKIP LOCKED` for ACID-compliant job locking, ensuring exactly-once processing even in distributed environments.

## 🚀 Features implemented
- **Concurrency Safety:** Uses `FOR UPDATE SKIP LOCKED` to allow multiple concurrent workers without race conditions.
- **Resilience:** Automatic **Exponential Backoff** retries for failed jobs (2s, 4s, 8s...).
- **Crash Recovery:** On startup, automatically resets "Zombie" jobs that were stuck in `processing` state during a hard crash.
- **Graceful Shutdown:** Listens for `SIGINT`/`SIGTERM` to finish active jobs before closing DB connections.
- **Observability:** Real-time stats endpoint (`/stats`) to monitor queue depth and latency.

## 🛠️ Tech Stack
- **Language:** TypeScript
- **Runtime:** Node.js (Express)
- **Database:** PostgreSQL (pg-pool)
- **Email:** Nodemailer (Gmail SMTP)

## 🏃‍♂️ How to Run

1. **Clone & Install**
   ```bash
   npm install
