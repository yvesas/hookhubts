
import pool from '../src/config/database';
import { ApiKeyService } from '../src/services/ApiKeyService';

const MESSAGE_FLOW_PAYLOAD = (id: string) => ({
    id: `evt_${id}`,
    type: 'message.inbound',
    created_at: new Date().toISOString(),
    data: {
        sender: { id: `usr_${Math.floor(Math.random() * 1000)}`, name: 'Simulated User' },
        recipient: { id: 'usr_support' },
        content: { type: 'text', body: 'Simulation message ' + id }
    }
});

const CHAT_RELAY_PAYLOAD = (id: string) => ({
    messageId: `msg-${id}`,
    messageType: 'text',
    timestamp: Math.floor(Date.now() / 1000),
    sender: { id: `u_${Math.floor(Math.random() * 1000)}` },
    content: 'Simulation chat ' + id
});

async function simulate() {
    console.log("🚀 Starting Traffic Simulation...");

    // 1. Fetch API Keys
    const keysRes = await pool.query(`
        SELECT k.key_hash, p.name as provider_name, k.id as key_id
        FROM api_keys k
        JOIN providers p ON k.provider_id = p.id
        WHERE k.is_active = true
    `);

    if (keysRes.rows.length === 0) {
        console.error("❌ No active API keys found. Run 'npm run seed' first.");
        process.exit(1);
    }

    // We can't use the hash to sign requests, we need the actual secret.
    // BUT the standard seed script outputted the secrets to console, but didn't save them in plain text in DB (good security).
    // HOWEVER, for simulation, we need the RAW keys.
    // The seed script usually generates keys and discards the plain text.
    // Problem: We can't simulate traffic if we don't have the plain text API keys.
    // Solution: The user (me) might know them, or I should generate a temporary "Simulation Key" if needed, OR relies on the fact that I can't reverse the hash.
    
    // WAIT. Authenticating requests requires the raw key X-API-Key.
    // The DB only stores the hash.
    // I CANNOT simulate traffic authenticated via the API if I don't have the keys.
    
    // Alternative: Create a new "Simulation Key" for each provider right now, use it, and maybe revoke it later?
    // Or assume the user provided them in ENV? 
    // Or... Modify the seed script to save them to a file? No.
    
    // Better approach: Check if seeded 'live' keys are hardcoded?
    // In `scripts/seed.ts` (viewed before), they were creating random bytes. Not hardcoded.
    
    // OK. I will insert a specific "Simulation" key for this script to use, or ask the user to provide one.
    // PROPOSAL: The script will generate a TEMPORARY key for simulation purposes for each provider found, 
    // run the simulation, and then delete it on exit? 
    // Or just create a permanent "Simulation Key".
    
    console.log("🔑 Creating Helper Simulation Keys...");
    
    const simulationKeys: Record<string, string> = {}; // provider_id -> raw_key

    const providers = await pool.query("SELECT id, name FROM providers");
    
    // Import crypto dynamically to avoid global scope issues if any
    const crypto = require('crypto');

    for (const provider of providers.rows) {
        // Create a known key for simulation
        const rawKey = `sk_sim_${provider.name.toLowerCase().replace(/\s+/g, '_')}_${crypto.randomBytes(4).toString('hex')}`;
        const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
        
        await pool.query(
            "INSERT INTO api_keys (provider_id, key_hash, key_prefix, name, is_active) VALUES ($1, $2, $3, $4, true)",
            [provider.id, hash, 'sk_sim', `Simulation Key - ${new Date().toISOString()}`]
        );
        
        simulationKeys[provider.name] = rawKey;
        console.log(`   👉 Created key for ${provider.name}: ${rawKey}`);
    }

    console.log("\n📡 Sending webhooks... (Press Ctrl+C to stop)\n");

    try {
        let count = 0;
        const providerNames = Object.keys(simulationKeys);

        while (true) {
            const providerName = providerNames[Math.floor(Math.random() * providerNames.length)];
            const apiKey = simulationKeys[providerName];
            const eventId = Date.now().toString() + Math.floor(Math.random() * 1000);
            
            let payload;
            if (providerName.toLowerCase().includes('messageflow')) {
                payload = MESSAGE_FLOW_PAYLOAD(eventId);
            } else {
                payload = CHAT_RELAY_PAYLOAD(eventId);
            }

            const response = await fetch('http://localhost:3000/webhooks/ingest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                },
                body: JSON.stringify(payload)
            });

            const statusIcon = response.status === 201 || response.status === 200 ? '✅' : '❌';
            console.log(`${statusIcon} [${new Date().toLocaleTimeString()}] ${providerName} -> ${response.status} ${response.statusText}`);

            count++;
            
            // Cleanup check? No, infinite loop until interrupt.
            
            // Random delay 200ms - 1500ms
            const delay = Math.floor(Math.random() * 1300) + 200;
            await new Promise(r => setTimeout(r, delay));
        }
    } catch (e) {
        console.error("Simulation error:", e);
    } finally {
        // Ideally we would cleanup keys here, but with Ctrl+C it's hard to guarantee unless we listen for signals.
        // Let's add signal listeners.
    }
}

// Cleanup on exit
const cleanup = async () => {
    console.log("\n🧹 Cleaning up simulation keys...");
    await pool.query("DELETE FROM api_keys WHERE key_prefix = 'sk_sim'");
    await pool.end();
    console.log("👋 Simulation ended.");
    process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

simulate();
