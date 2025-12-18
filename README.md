# Task Queue & Job Scheduler (Node.js + TypeScript)

A fault-tolerant asynchronous job processing system built using **Node.js**, **TypeScript**, and **PostgreSQL**.  
This project demonstrates how to design a reliable background worker system with safe concurrency, retries, and graceful shutdown handling.

---

## 🚀 Overview

This system allows clients to submit background jobs (e.g., sending emails) via an API.  
Jobs are stored in PostgreSQL and processed asynchronously by a worker using a **queue–worker model**.

To ensure correctness under concurrency and failures, the system relies on **PostgreSQL row-level locking** (`FOR UPDATE SKIP LOCKED`) instead of external brokers like Redis.

---

## ✨ Key Features

- **Asynchronous Job Processing**  
  Jobs are processed in the background without blocking API requests.

- **Concurrency Safety**  
  Uses PostgreSQL row-level locks (`FOR UPDATE SKIP LOCKED`) to allow multiple workers without race conditions.

- **Fault Tolerance & Retries**  
  Failed jobs are retried using **exponential backoff** to avoid overwhelming the system.

- **Crash & Zombie Job Recovery**  
  On startup, jobs left in `PROCESSING` state due to crashes are safely recovered.

- **Graceful Shutdown**  
  Handles `SIGINT` / `SIGTERM` signals to finish active jobs before shutting down, ensuring zero data loss.

- **Observability**  
  Provides queue statistics via a `/stats` endpoint for monitoring.

---

## 🛠️ Tech Stack

- **Language:** TypeScript  
- **Runtime:** Node.js  
- **Framework:** Express  
- **Database:** PostgreSQL  
- **Email Service:** Nodemailer (Gmail SMTP)  

---

## 🧠 System Design (High-Level)

1. Client submits a job via HTTP API  
2. Job metadata is persisted in PostgreSQL  
3. Worker polls for available jobs using row locking  
4. Job is processed asynchronously  
5. Job status is updated (`PENDING → PROCESSING → COMPLETED / FAILED`)  
6. Failed jobs are retried with backoff  

> In production, this design can be extended with multiple workers or external queues (e.g., Redis, RabbitMQ).

---

## 🏃‍♂️ How to Run Locally

### 1️⃣ Install Dependencies
npm install

### 2️⃣ Environment Variables
Create a .env file:
env
Copy code
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/task_queue
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password


### 3️⃣ Start the Server
Copy code
npm run dev
Server will start on:

http://localhost:3000
Worker starts automatically.

### 🧪 Testing the System

Add a Job

curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{
        "email": "test@example.com",
        "subject": "Hello",
        "body": "This is a test email",
        "delay": 5
      }'

### Check Queue Stats

curl http://localhost:3000/stats
⏱️ Time & Space Complexity
Job enqueue: O(1)

Job polling: O(1)

Worker execution: Depends on job logic

Database operations: Indexed lookups

## 📌 Why PostgreSQL Instead of Redis?
ACID guarantees

Built-in concurrency control

No additional infrastructure required

Simpler failure recovery

This makes the system easier to reason about while remaining production-capable.

## 📈 Future Improvements
Multiple distributed workers

Redis or message broker integration

Job prioritization

Dead-letter queue

Metrics & dashboards

