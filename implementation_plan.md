# HookHubTS - Plano de Implementação Detalhado (Node.js/Express)

## Visão Geral do Projeto

Construir um **serviço gateway de webhooks** utilizando **Node.js e Express** que:
- Recebe eventos de múltiplos provedores externos (MessageFlow e ChatRelay)
- Normaliza payloads diferentes em um schema unificado
- Persiste eventos de forma confiável no PostgreSQL
- Fornece API REST para consulta de eventos
- Oferece interface web para gerenciamento de eventos e API keys
- Implementa autenticação via API keys
- Garante idempotência e resposta rápida (< 200ms)

---

## Requisitos

### 1. Ingestão de Webhooks
- ✅ Endpoint HTTP POST para receber payloads
- ✅ Suportar 2 formatos diferentes (MessageFlow e ChatRelay)
- ✅ Normalizar para schema único na tabela `events`
- ✅ Responder em até 200ms
- ✅ Persistir no PostgreSQL
- ✅ Garantir idempotência (duplicatas não criam registros duplicados)

### 2. Autenticação de Provedores
- ✅ API keys vinculadas a provedores específicos
- ✅ Rejeitar requisições sem API key válida
- ✅ Retornar códigos HTTP apropriados (401/403)

### 3. Interface de Gerenciamento
**Histórico de Eventos:**
- ✅ Consultar eventos por provedor, tipo e/ou intervalo de tempo
- ✅ Exibir resultados em lista paginada

**Gerenciamento de API Keys:**
- ✅ Criar novas chaves para um provedor
- ✅ Listar chaves existentes (mascarar valor após criação)
- ✅ Revogar chaves

### 4. Stack Tecnológico
- ✅ **Runtime:** Node.js (v20+)
- ✅ **Framework:** Express
- ✅ **Linguagem:** TypeScript
- ✅ **Validação:** Zod
- ✅ **Frontend:** EJS + TailwindCSS + DaisyUI
- ✅ **Banco de Dados:** PostgreSQL
- ✅ **Execução:** Docker Compose

### 5. Critérios de Avaliação (Foco)
- **Simplicidade:** Estrutura clara, sem over-engineering.
- **Performance:** Processamento assíncrono onde possível, indexação correta.
- **Segurança:** Validação rigorosa (Zod), tratamento de erros seguro.
- **Consciência de Produção:** Logs estruturados, idempotência, healthchecks.

---

## Arquitetura Proposta

```mermaid
graph TB
    subgraph "Provedores Externos"
        A[MessageFlow]
        B[ChatRelay]
    end
    
    subgraph "HookHub Gateway (Node.js)"
        C[API Endpoint<br/>/webhooks/ingest]
        D[Autenticação<br/>API Key Middleware]
        E[Service Layer<br/>Parser & Normalizer]
        F[PostgreSQL]
        G[API REST<br/>/api/events, /api/keys]
        H[Interface Web<br/>(EJS + Tailwind)]
    end
    
    A -->|POST webhook| C
    B -->|POST webhook| C
    C --> D
    D -->|Válido| E
    D -->|Inválido| I[HTTP 401/403]
    E --> F
    F --> G
    G --> H
    
    style C fill:#4CAF50
    style F fill:#2196F3
    style H fill:#FF9800
```

---

## Schema do Banco de Dados

O schema permanece o mesmo da versão original, garantindo compatibilidade de dados.

### Tabela: `providers`
```sql
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Tabela: `api_keys`
```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(20) NOT NULL,
    name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMP
);

CREATE INDEX idx_api_keys_provider ON api_keys(provider_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
```

### Tabela: `events` (Schema Normalizado)
```sql
CREATE TABLE events (
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

CREATE INDEX idx_events_provider ON events(provider_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_timestamp ON events(timestamp);
CREATE INDEX idx_events_created ON events(created_at);
```

---

## Estrutura do Projeto (Node.js/TypeScript)

```
hookhub-ts/
├── src/
│   ├── config/
│   │   ├── database.ts      # Configuração do DB
│   │   └── env.ts           # Variáveis de ambiente
│   ├── controllers/
│   │   ├── WebhookController.ts
│   │   ├── EventController.ts
│   │   └── ApiKeyController.ts
│   ├── middlewares/
│   │   ├── apiKeyAuth.ts    # Middleware de autenticação
│   │   └── errorHandler.ts
│   ├── models/              # Definições de tipos/interfaces
│   │   ├── Event.ts
│   │   └── ApiKey.ts
│   ├── services/
│   │   ├── NormalizerService.ts # Lógica de normalização
│   │   ├── EventService.ts      # Acesso a dados de eventos
│   │   └── ApiKeyService.ts     # Gerenciamento de chaves
│   ├── routes/
│   │   ├── api.ts
│   │   └── webhooks.ts
│   ├── views/               # Templates (EJS)
│   │   ├── layouts/
│   │   │   └── main.ejs
│   │   ├── partials/
│   │   ├── index.ejs
│   │   └── keys.ejs
│   ├── public/
│   │   ├── css/
│   │   │   └── styles.css   # Tailwind output
│   │   └── js/
│   ├── app.ts               # Setup do Express
│   └── server.ts            # Entry point
├── dist/                    # Código compilado
├── scripts/                 # Scripts de migração/seed
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

---

## Implementação de Idempotência (Node.js)

A idempotência é garantida capturando o erro de violação de constraint única do PostgreSQL (código `23505`).

**Código exemplo (TypeScript):**
```typescript
try {
  const result = await db.query(
    'INSERT INTO events (...) VALUES (...) RETURNING id',
    [...values]
  );
  return { status: 'created', id: result.rows[0].id };
} catch (error: any) {
  // Código de erro PostgreSQL para unique_violation
  if (error.code === '23505') {
    console.log('Evento duplicado ignorado:', externalEventId);
    return { status: 'duplicate' }; // Tratar como sucesso (idempotente)
  }
  throw error;
}
```

---

## Docker Compose

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: hookhub
      POSTGRES_PASSWORD: hookhub_dev
      POSTGRES_DB: hookhub_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hookhub"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgres://hookhub:hookhub_dev@db:5432/hookhub_dev
      PORT: 3000
      NODE_ENV: development
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_data:
```

---

## Plano de Verificação

### Automated Tests
- **Unit Tests:** Jest para testar a lógica de normalização (parsers) isoladamente.
- **Integration Tests:** Supertest + Jest para testar os endpoints da API com um banco de dados de teste.

### Manual Verification
1. **Setup:** Rodar `docker compose up` e verificar logs.
2. **Ingestão:** Usar `curl` ou Postman para enviar payloads de exemplo (MessageFlow e ChatRelay) e verificar se retorna 200 OK.
3. **Idempotência:** Enviar o mesmo payload duas vezes e verificar se a segunda resposta é 200 OK mas não cria novo registro no banco.
4. **Autenticação:** Tentar enviar sem header `X-API-Key` e verificar 401.
5. **Interface:** Acessar `http://localhost:3000` e navegar pelo histórico e gerenciamento de chaves.
