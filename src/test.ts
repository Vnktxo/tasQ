async function sendJob() {
    try {
        console.log("🚀 Sending job...");
        const response = await fetch('http://localhost:3000/jobs', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                email: "neymarjr5031@gmail.com",
                subject: "TasQ Test mail",
                body: "This is a test mail sent via my TasQ system!",
                delay: 2
            })
        });

        // 1. Read the raw text first!
        const text = await response.text();

        // 2. Check if it was successful
        if (!response.ok) {
            console.error(`❌ Server Error (${response.status}):`);
            console.error(text); // <--- THIS WILL PRINT THE REAL ERROR
            return;
        }

        // 3. If success, parse it
        const data = JSON.parse(text);
        console.log('✅ Response from server:', data);

    } catch (err) {
        console.error('❌ Connection Failed:', err);
    }
}

sendJob();