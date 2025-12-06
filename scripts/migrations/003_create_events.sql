CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id),
    external_event_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    
    -- Dados do remetente
    sender_id VARCHAR(255),
    sender_name VARCHAR(255),
    
    -- Dados do destinatário
    recipient_id VARCHAR(255),
    recipient_name VARCHAR(255),
    
    -- Conteúdo da mensagem
    message_type VARCHAR(50),
    message_body TEXT,
    
    -- Metadados adicionais
    platform VARCHAR(50),
    raw_payload JSONB NOT NULL,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_provider_event UNIQUE(provider_id, external_event_id)
);

CREATE INDEX IF NOT EXISTS idx_events_provider ON events(provider_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
