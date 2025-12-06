# 🚀 HookHubTS - Webhook Gateway Service

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://docs.docker.com/compose/)

HookHubTS é um serviço gateway de webhooks que recebe eventos de múltiplos provedores externos, normaliza os dados em um schema unificado, persiste no PostgreSQL e fornece APIs REST + interface web para gerenciamento completo.

## 📋 Índice

- [Características](#-características)
- [Início Rápido](#-início-rápido)
- [Desenvolvimento](#-desenvolvimento)
- [Arquitetura](#-arquitetura)
- [API Reference](#-api-reference)
- [Interface Web](#-interface-web)
- [Testes](#-testes)
- [Documentação](#-documentação)

## ✨ Características

### Core Features

- ⚡ **Ingestão de Webhooks** - Endpoint otimizado com resposta < 200ms
- 🔄 **Normalização Automática** - Suporte a múltiplos provedores (MessageFlow, ChatRelay)
- 🔒 **Autenticação Segura** - API keys com hash SHA256
- 🎯 **Idempotência Garantida** - Eventos duplicados não criam registros
- 📊 **APIs REST Completas** - Consulta, filtros e paginação
- 🎨 **Interface Web Moderna** - Dashboard com Tailwind CSS + DaisyUI
- ✅ **Validação Rigorosa** - Schema validation com Zod
- 📝 **Logs Estruturados** - JSON logging para observabilidade

### Diferenciais

- 🐳 **Docker Ready** - Setup completo com um comando
- ⚡ **Hot Reload** - Desenvolvimento com `tsx` para mudanças instantâneas
- 📝 **Documentação Extensiva** - Guias e exemplos completos

## 🚀 Início Rápido

### Pré-requisitos

- Docker & Docker Compose
- (Opcional) Node.js 20+ para desenvolvimento local

### Instalação e Execução

```bash
# 1. Clone o repositório
git clone <repository-url>
cd HookHubTS

# 2. (Opcional) Instale as dependências localmente
npm install

# 3. Inicie a aplicação com Docker
docker compose up -d

# 4. Execute as migrations e seeds
npm run migrate
npm run seed

# 5. Acesse a aplicação
open http://localhost:3000
```

**Pronto!** A aplicação estará rodando em http://localhost:3000

### API Keys Geradas

Após executar o seed, você receberá uma API key:

```
✓ MessageFlow API Key: hh_live_XXXXX...
```

**⚠️ Importante:** Salve essa chave! Ela é necessária para testar a ingestão de webhooks.

## 💻 Desenvolvimento

### Desenvolvimento Local (Recomendado) ⚡

```bash
# Inicie apenas o banco de dados via Docker
docker compose up -d db

# Instale dependências
npm install

# Execute migrations e seeds
npm run migrate
npm run seed

# Inicie o servidor de desenvolvimento (hot reload)
npm run dev
```

Acesse: http://localhost:3000

### Desenvolvimento com Docker 🐳

```bash
docker compose up -d
```

### Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor com hot reload (tsx) |
| `npm run build` | Build para produção |
| `npm run start` | Inicia build de produção |
| `npm run migrate` | Executa migrations |
| `npm run seed` | Popula banco com dados iniciais |
| `npm test` | Executa testes |

## 🏗️ Arquitetura

### Stack Tecnológico

- **Runtime:** Node.js 20+
- **Framework:** Express 4.x
- **Linguagem:** TypeScript 5.x
- **Validação:** Zod
- **Database:** PostgreSQL 15
- **Frontend:** EJS + Tailwind CSS + DaisyUI
- **Container:** Docker + Docker Compose

### Estrutura do Projeto

```
HookHubTS/
├── src/
│   ├── config/
│   │   ├── database.ts          # Configuração do DB
│   │   └── env.ts               # Variáveis de ambiente
│   ├── controllers/
│   │   ├── WebhookController.ts # Ingestão de webhooks
│   │   ├── EventController.ts   # API de eventos
│   │   └── ApiKeyController.ts  # Gerenciamento de keys
│   ├── middlewares/
│   │   ├── apiKeyAuth.ts        # Autenticação
│   │   └── errorHandler.ts      # Tratamento de erros
│   ├── services/
│   │   ├── NormalizerService.ts # Normalização de payloads
│   │   ├── EventService.ts      # Lógica de eventos
│   │   └── ApiKeyService.ts     # Lógica de API keys
│   ├── routes/
│   │   ├── api.ts               # Rotas da API
│   │   └── webhooks.ts          # Rotas de webhook
│   ├── views/                   # Templates EJS
│   └── server.ts                # Entry point
├── scripts/                     # Scripts de migração/seed
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

### Database Schema

```sql
-- Providers (MessageFlow, ChatRelay)
providers (id, name, description, created_at, updated_at)

-- API Keys (authentication)
api_keys (
  id, provider_id, name, key_hash, key_prefix,
  is_active, expires_at, revoked_at,
  created_at
)

-- Events (normalized schema)
events (
  id, provider_id, external_event_id, event_type,
  sender_id, sender_name, recipient_id, recipient_name,
  message_type, message_body, platform, timestamp,
  raw_payload, created_at
)
```

**Constraints:**
- `UNIQUE(provider_id, external_event_id)` - Idempotência

**Indexes:**
- `provider_id, timestamp` - Performance em queries
- `event_type` - Filtros rápidos

## 📡 API Reference

### Webhook Ingestion

```bash
POST /webhooks/ingest
Headers:
  Content-Type: application/json
  X-API-Key: hh_live_XXXXX...

# MessageFlow payload
{
  "event_id": "msg_001",
  "event_type": "message.inbound",
  "timestamp": "2025-12-04T00:00:00Z",
  "data": {
    "sender": {"id": "usr_001", "name": "Alice"},
    "recipient": {"id": "acc_001"},
    "content": {"type": "text", "body": "Hello!"}
  }
}

# ChatRelay payload
{
  "id": "cr_001",
  "type": "INCOMING_MESSAGE",
  "created_at": 1733280000,
  "payload": {
    "platform": "WHATSAPP",
    "from": "+5511999999999",
    "from_name": "Bob",
    "to": "+5511888888888",
    "message": {"format": "TEXT", "text": "Hello!"}
  }
}
```

### Events API

```bash
# List events with filters
GET /api/events?provider_id=UUID&event_type=message.inbound&page=1

# Get specific event
GET /api/events/:id
```

### API Keys Management

```bash
# Create new API key
POST /api/keys
{
  "provider_id": "UUID",
  "name": "Production Key"
}

# List API keys
GET /api/keys

# Revoke API key
DELETE /api/keys/:id
```

**Veja exemplos completos em:** [API_EXAMPLES.md](API_EXAMPLES.md)

## 🎨 Interface Web

### Dashboard de Eventos

**URL:** http://localhost:3000

**Features:**
- 📊 Lista de eventos com paginação
- 🔍 Filtros por provedor, tipo e data
- 📝 Detalhes expansíveis com payload completo

### Gerenciamento de API Keys

**URL:** http://localhost:3000/api-keys

**Features:**
- ➕ Criar novas API keys
- 📋 Listar chaves (mascaradas)
- 🗑️ Revogar chaves
- 📋 Copiar para clipboard

## 🧪 Testes

### Teste Rápido

```bash
# Testar ingestão de webhook
curl -X POST http://localhost:3000/webhooks/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "event_id": "test_001",
    "event_type": "message.inbound",
    "timestamp": "2025-12-04T00:00:00Z",
    "data": {
      "sender": {"id": "usr_001", "name": "Test"},
      "recipient": {"id": "acc_001"},
      "content": {"type": "text", "body": "Hello!"}
    }
  }'

# Verificar eventos
curl http://localhost:3000/api/events | jq
```

### Suite de Testes

```bash
npm test
```

**Veja guia completo em:** [TESTING.md](TESTING.md)

## 📚 Documentação

- **[API_EXAMPLES.md](API_EXAMPLES.md)** - Exemplos completos de uso da API
- **[TESTING.md](TESTING.md)** - Guia de testes e validação

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Database
DATABASE_URL=postgres://hookhub:hookhub_dev@localhost:5432/hookhub_dev

# Application
PORT=3000
NODE_ENV=development
```

### Docker Compose

```yaml
services:
  db:
    image: postgres:15-alpine
    ports: ["5432:5432"]
    
  app:
    build: .
    ports: ["3000:3000"]
    depends_on:
      db:
        condition: service_healthy
```

## 🚨 Troubleshooting

### Porta 3000 em uso

```bash
lsof -i :3000
kill -9 <PID>
```

### Erro de conexão com banco

```bash
docker compose ps
docker compose restart db
```

## 📊 Performance & Segurança

### Performance
- ⚡ **Ingestão:** < 200ms por webhook
- 🔄 **Idempotência:** Constraint no banco (error code 23505)
- 📈 **Escalabilidade:** Connection pooling

### Segurança
- 🔐 **API Keys:** Hash SHA256
- 🛡️ **Validação:** Zod schemas
- ⏰ **Expiração:** Suporte a chaves temporárias
- 🚫 **Revogação:** Desativação instantânea

---

Desenvolvido com Node.js + Express + TypeScript
