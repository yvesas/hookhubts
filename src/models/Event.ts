export interface NormalizedEvent {
  external_event_id: string;
  event_type: string;
  timestamp: Date;
  sender_id?: string;
  sender_name?: string;
  recipient_id?: string;
  recipient_name?: string;
  message_type?: string;
  message_body?: string;
  platform?: string;
  raw_payload: any;
}

export interface DbEvent extends NormalizedEvent {
  id: string;
  provider_id: string;
  created_at: Date;
}
