import pool from '../src/config/database';
import crypto from 'crypto';

const generateApiKey = (): string => {
  return 'hh_live_' + crypto.randomBytes(20).toString('hex');
};

const hashKey = (key: string): string => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

const seed = async () => {
  const client = await pool.connect();
  try {
    console.log('🧹 Cleaning existing data...');
    await client.query('DELETE FROM events');
    await client.query('DELETE FROM api_keys');
    await client.query('DELETE FROM providers');

    console.log('📦 Creating providers...');

    // Create MessageFlow provider
    const messageflowRes = await client.query(
      `INSERT INTO providers (name, description) VALUES ($1, $2) RETURNING id`,
      ['MessageFlow', 'Real-time messaging platform']
    );
    const messageflowId = messageflowRes.rows[0].id;

    // Create ChatRelay provider
    const chatrelayRes = await client.query(
      `INSERT INTO providers (name, description) VALUES ($1, $2) RETURNING id`,
      ['ChatRelay', 'Multi-channel chat relay service']
    );
    const chatrelayId = chatrelayRes.rows[0].id;

    console.log(`✅ Created 2 providers`);

    console.log('🔑 Creating API keys...');

    // Generate keys
    const messageflowKey = generateApiKey();
    const chatrelayKey = generateApiKey();

    // Insert MessageFlow key
    await client.query(
      `INSERT INTO api_keys (provider_id, key_hash, key_prefix, name, is_active) 
       VALUES ($1, $2, $3, $4, $5)`,
      [messageflowId, hashKey(messageflowKey), messageflowKey.substring(0, 13), 'MessageFlow Production', true]
    );

    // Insert ChatRelay key
    await client.query(
      `INSERT INTO api_keys (provider_id, key_hash, key_prefix, name, is_active) 
       VALUES ($1, $2, $3, $4, $5)`,
      [chatrelayId, hashKey(chatrelayKey), chatrelayKey.substring(0, 13), 'ChatRelay Production', true]
    );

    console.log('\n' + '='.repeat(60));
    console.log('🔐 API KEYS GENERATED - SAVE THESE!');
    console.log('='.repeat(60));
    console.log(`MessageFlow API Key: ${messageflowKey}`);
    console.log(`ChatRelay API Key:   ${chatrelayKey}`);
    console.log('='.repeat(60) + '\n');

    // Generate realistic events over last 30 days
    console.log('📊 Generating realistic event data (last 30 days)...');

    const eventTypesMessageFlow = [
      'message.inbound',
      'message.outbound',
      'message.delivered',
      'message.read',
      'user.joined',
      'user.left',
      'typing.started',
      'typing.stopped'
    ];

    const eventTypesChatRelay = [
      'INCOMING_MESSAGE',
      'OUTGOING_MESSAGE',
      'MESSAGE_DELIVERED',
      'MESSAGE_READ',
      'USER_ONLINE',
      'USER_OFFLINE',
      'CHANNEL_CREATED',
      'CHANNEL_DELETED'
    ];

    const platforms = ['WHATSAPP', 'TELEGRAM', 'SLACK', 'DISCORD'];
    const users = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];

    const totalEvents = 500;
    const now = new Date();

    console.log(`Generating ${totalEvents} events...`);

    for (let i = 1; i <= totalEvents; i++) {
      // Random day in last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const minutesAgo = Math.floor(Math.random() * 60);

      const timestamp = new Date(now);
      timestamp.setDate(timestamp.getDate() - daysAgo);
      timestamp.setHours(timestamp.getHours() - hoursAgo);
      timestamp.setMinutes(timestamp.getMinutes() - minutesAgo);

      // Alternate between providers (MessageFlow gets more events)
      const isMessageFlow = i % 3 !== 0;
      const providerId = isMessageFlow ? messageflowId : chatrelayId;

      if (isMessageFlow) {
        // MessageFlow event
        const eventType = eventTypesMessageFlow[Math.floor(Math.random() * eventTypesMessageFlow.length)];
        const sender = users[Math.floor(Math.random() * users.length)];
        const otherUsers = users.filter(u => u !== sender);
        const recipient = otherUsers[Math.floor(Math.random() * otherUsers.length)];

        const rawPayload = {
          event_id: `msg_${i}`,
          event_type: eventType,
          timestamp: timestamp.toISOString(),
          data: {
            sender: { id: `usr_${sender.toLowerCase()}`, name: sender },
            recipient: { id: `usr_${recipient.toLowerCase()}` },
            content: { type: 'text', body: `Sample message ${i}` }
          }
        };

        await client.query(
          `INSERT INTO events (
            provider_id, external_event_id, event_type, timestamp,
            sender_id, sender_name, recipient_id, recipient_name,
            message_type, message_body, platform, raw_payload
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            providerId,
            `msg_${i}_${Math.floor(Math.random() * 999999)}`,
            eventType,
            timestamp,
            `usr_${sender.toLowerCase()}`,
            sender,
            `usr_${recipient.toLowerCase()}`,
            recipient,
            eventType.includes('message') ? 'text' : null,
            eventType.includes('message') ? `Sample message ${i}` : null,
            'MessageFlow',
            JSON.stringify(rawPayload)
          ]
        );
      } else {
        // ChatRelay event
        const eventType = eventTypesChatRelay[Math.floor(Math.random() * eventTypesChatRelay.length)];
        const sender = users[Math.floor(Math.random() * users.length)];
        const otherUsers = users.filter(u => u !== sender);
        const recipient = otherUsers[Math.floor(Math.random() * otherUsers.length)];
        const platform = platforms[Math.floor(Math.random() * platforms.length)];

        const rawPayload = {
          id: `cr_${i}`,
          type: eventType,
          created_at: Math.floor(timestamp.getTime() / 1000),
          payload: {
            platform: platform,
            from: `+5511${Math.floor(Math.random() * 900000000) + 100000000}`,
            from_name: sender,
            to: `+5511${Math.floor(Math.random() * 900000000) + 100000000}`,
            message: { format: 'TEXT', text: `Sample message ${i}` }
          }
        };

        await client.query(
          `INSERT INTO events (
            provider_id, external_event_id, event_type, timestamp,
            sender_id, sender_name, recipient_id, recipient_name,
            message_type, message_body, platform, raw_payload
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            providerId,
            `cr_${i}_${Math.floor(Math.random() * 999999)}`,
            eventType,
            timestamp,
            `+5511${Math.floor(Math.random() * 900000000) + 100000000}`,
            sender,
            `+5511${Math.floor(Math.random() * 900000000) + 100000000}`,
            recipient,
            eventType.includes('MESSAGE') ? 'TEXT' : null,
            eventType.includes('MESSAGE') ? `Sample message ${i}` : null,
            platform,
            JSON.stringify(rawPayload)
          ]
        );
      }

      if (i % 50 === 0) {
        process.stdout.write('.');
      }
    }

    // Get statistics
    const countRes = await client.query('SELECT COUNT(*) FROM events');
    const totalCount = parseInt(countRes.rows[0].count);

    const messageflowCount = await client.query(
      'SELECT COUNT(*) FROM events WHERE provider_id = $1',
      [messageflowId]
    );

    const chatrelayCount = await client.query(
      'SELECT COUNT(*) FROM events WHERE provider_id = $1',
      [chatrelayId]
    );

    const topTypes = await client.query(`
      SELECT event_type, COUNT(*) as count
      FROM events
      GROUP BY event_type
      ORDER BY count DESC
      LIMIT 5
    `);

    const dateRange = await client.query(`
      SELECT MIN(timestamp) as min_date, MAX(timestamp) as max_date
      FROM events
    `);

    console.log(`\n✅ Generated ${totalCount} events`);
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEED DATA SUMMARY');
    console.log('='.repeat(60));
    console.log(`Providers: 2`);
    console.log(`API Keys:  2`);
    console.log(`Events:    ${totalCount}`);
    console.log('\nEvents by Provider:');
    console.log(`  MessageFlow: ${messageflowCount.rows[0].count}`);
    console.log(`  ChatRelay:   ${chatrelayCount.rows[0].count}`);
    console.log('\nTop Event Types:');
    topTypes.rows.forEach(row => {
      console.log(`  ${row.event_type}: ${row.count}`);
    });
    console.log('\nDate Range:');
    console.log(`  From: ${new Date(dateRange.rows[0].min_date).toISOString().slice(0, 16).replace('T', ' ')}`);
    console.log(`  To:   ${new Date(dateRange.rows[0].max_date).toISOString().slice(0, 16).replace('T', ' ')}`);
    console.log('='.repeat(60));
    console.log('\n🎉 Seeds completed successfully!');
    console.log('\n💡 Access the application:');
    console.log('   http://localhost:3000');
    console.log('   http://localhost:3000/analytics');
    console.log('\n');

  } catch (err) {
    console.error('Error seeding:', err);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
