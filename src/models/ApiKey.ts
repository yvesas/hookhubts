export interface ApiKey {
  id: string;
  provider_id: string;
  key_hash: string;
  key_prefix: string;
  name?: string;
  is_active: boolean;
  expires_at?: Date;
  revoked_at?: Date;
}
