const { ImapFlow } = require('imapflow');
require('dotenv').config();

const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    logger: true // Set to true if you want to see the raw matrix code
});

async function main() {
    try {
        console.log("⏳ Connecting to Gmail via ImapFlow...");
        await client.connect();

        console.log("🔓 Connection Secured. Opening Inbox...");
        let lock = await client.getMailboxLock('INBOX');

        try {
            // Fetch the latest email to prove it works
            let message = await client.fetchOne(client.mailbox.exists, { source: true });
            console.log(`\n✅ SUCCESS! IMAP is ENABLED.`);
            console.log(`📩 Latest Email ID: ${message.seq}`);

            // We are done, release the lock
        } finally {
            lock.release();
        }

        await client.logout();
    } catch (err) {
        console.log("\n❌ CONNECTION FAILED");
        console.log("---------------------------------------------------");
        if (err.responseStatus === 'NO') {
            console.log("🚫 GMAIL REJECTED THE LOGIN.");
            console.log("Likely Causes:");
            console.log("1. App Password is wrong (Regenerate it).");
            console.log("2. IMAP is strictly DISABLED by your Admin.");
        } else {
            console.log("⚠️ PROTOCOL ERROR:");
            console.log(err.message);
        }
        console.log("---------------------------------------------------");
    }
}

main();
