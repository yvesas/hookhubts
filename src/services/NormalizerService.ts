import { NormalizedEvent } from '../models/Event';

interface WebhookPayload {
  [key: string]: any;
}

export class NormalizerService {
  static normalize(provider: string, payload: WebhookPayload): NormalizedEvent {
    switch (provider.toLowerCase()) {
      case 'messageflow':
        return this.parseMessageFlow(payload);
      case 'chatrelay':
        return this.parseChatRelay(payload);
      default:
        throw new Error(`Unknown provider parser: ${provider}`);
    }
  }

  private static parseMessageFlow(payload: any): NormalizedEvent {
    // Hypothetical structure for MessageFlow
    // { id: 'evt_123', type: 'incoming_message', created_at: 'iso_date', data: { from: 'u1', text: 'hello' } }
    return {
      external_event_id: payload.id || `gen_${Date.now()}`,
      event_type: payload.type || 'unknown',
      timestamp: payload.created_at ? new Date(payload.created_at) : new Date(),
      sender_id: payload.data?.from,
      message_body: payload.data?.text,
      raw_payload: payload,
      platform: 'MessageFlow'
    };
  }

  private static parseChatRelay(payload: any): NormalizedEvent {
    // Hypothetical structure for ChatRelay
    // { messageId: 'msg-abc', messageType: 'text', timestamp: 1234567890, sender: { id: 'u2' }, content: 'hi' }
    return {
      external_event_id: payload.messageId || `gen_${Date.now()}`,
      event_type: 'message',
      timestamp: payload.timestamp ? new Date(payload.timestamp * 1000) : new Date(),
      sender_id: payload.sender?.id,
      message_body: payload.content,
      message_type: payload.messageType,
      raw_payload: payload,
      platform: 'ChatRelay'
    };
  }
}
