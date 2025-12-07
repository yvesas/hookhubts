import { NormalizerService } from '../../services/NormalizerService';

describe('NormalizerService', () => {
  describe('MessageFlow', () => {
    it('should normalize a standard MessageFlow payload', () => {
      const payload = {
        id: 'msg_123',
        type: 'incoming_message',
        created_at: '2023-01-01T12:00:00Z',
        data: {
          from: 'user_1',
          text: 'Hello World'
        }
      };

      const result = NormalizerService.normalize('MessageFlow', payload);

      expect(result).toMatchObject({
        external_event_id: 'msg_123',
        event_type: 'incoming_message',
        sender_id: 'user_1',
        message_body: 'Hello World',
        platform: 'MessageFlow'
      });
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.toISOString()).toBe('2023-01-01T12:00:00.000Z');
    });

    it('should handle missing optional fields', () => {
      const payload = { id: 'msg_456' };
      const result = NormalizerService.normalize('MessageFlow', payload);
      expect(result.external_event_id).toBe('msg_456');
      expect(result.event_type).toBe('unknown');
    });
  });

  describe('ChatRelay', () => {
    it('should normalize a standard ChatRelay payload', () => {
      const payload = {
        messageId: 'cr_789',
        messageType: 'text',
        timestamp: 1672574400, // 2023-01-01 12:00:00 UTC
        sender: { id: 'user_2' },
        content: 'Hi there'
      };

      const result = NormalizerService.normalize('ChatRelay', payload);

      expect(result).toMatchObject({
        external_event_id: 'cr_789',
        event_type: 'message',
        sender_id: 'user_2',
        message_body: 'Hi there',
        message_type: 'text',
        platform: 'ChatRelay'
      });
      expect(result.timestamp.toISOString()).toBe('2023-01-01T12:00:00.000Z');
    });
  });

  it('should throw error for unknown provider', () => {
    expect(() => {
      NormalizerService.normalize('UnknownProvider', {});
    }).toThrow('Unknown provider parser: UnknownProvider');
  });
});
