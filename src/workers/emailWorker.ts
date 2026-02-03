import { ImapFlow } from 'imapflow';
import { query } from '../db';
import dotenv from 'dotenv';

const KEYWORDS = ['Haveloc', 'New Job', 'New Job Offer', 'Job application', 'Offer', 'Assessment', 'Scheduled', 'URGENT'];


const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER!,
        pass: process.env.EMAIL_PASS!
    },
    logger: false
});

async function saveEmail(email: any, keyword: string) {
    const sql = `
        INSERT INTO extracted_emails
        (remote_id, sender, subject, received_at, keyword_matched)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (remote_id) DO NOTHING
        RETURNING id;
    `;

    // Safety check for missing dates
    const date = email.envelope.date ? new Date(email.envelope.date) : new Date();

    const res = await query(sql, [
        email.uid,
        email.envelope.from[0].address,
        email.envelope.subject,
        date,
        keyword
    ]);

    if (res.rowCount && res.rowCount > 0) {
        console.log(`[💾 Saved] ID: ${res.rows[0].id} | Subject: ${email.envelope.subject}`);
    } else {
        console.log(`[⏩ Skipped] Duplicate UID: ${email.uid}`);
    }
}

async function run() {
    try {
        console.log("⏳ Connecting to Gmail...");
        await client.connect();

        let lock = await client.getMailboxLock('INBOX');

        try {
            console.log("📅 Calculating 'Today'...");
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Midnight

            console.log("🔍 Searching for emails received since:", today.toLocaleString());

            // 1. Get IDs (Returns number[] OR false)
            const list = await client.search({ since: today });

            // FIX: Explicitly handle the 'false' case
            if (list === false || list.length === 0) {
                console.log("📭 No emails found from today.");
            } else {
                console.log(`📨 Found ${list.length} emails from today. Filtering for keywords...`);

                // 2. Fetch specific messages
                const messages = client.fetch(list, { envelope: true, uid: true });

                for await (let msg of messages) {
                    // FIX: Optional chaining for safety
                    const subject = msg.envelope?.subject || "";

                    const matchedKeyword = KEYWORDS.find(k =>
                        subject.toLowerCase().includes(k.toLowerCase())
                    );

                    if (matchedKeyword) {
                        console.log(`[✨ MATCH] Found "${matchedKeyword}" in: ${subject}`);
                        await saveEmail(msg, matchedKeyword);
                    }
                }
            }

        } finally {
            lock.release();
        }

        await client.logout();
        console.log("✅ Daily Scan Complete.");

    } catch (err) {
        console.error("❌ Worker Failed:", err);
    }
}

run();
