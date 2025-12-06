# Guia de Testes e Validação - HookHubTS

Este documento descreve como testar e validar todas as funcionalidades do HookHubTS.

## 🚀 Início Rápido

### 1. Iniciar a Aplicação

```bash
# Iniciar com Docker Compose
docker compose up -d

# Ou apenas o banco + app local
docker compose up -d db
npm run dev
```

### 2. Executar Migrations e Seeds

```bash
npm run migrate
npm run seed
```

**Importante:** Copie a API key gerada! Exemplo de saída:

```
Creating providers...
✓ Created provider: MessageFlow

Creating API keys...
✓ MessageFlow API Key: hh_live_abc123def456...
  (Save this key, it won't be shown again)

✅ Database seeded successfully!
```

### 3. Executar Testes

```bash
npm test
```

## ✅ Checklist de Validação

### Fase 1: Infraestrutura

- [ ] Docker Compose inicia sem erros
- [ ] PostgreSQL está rodando e acessível
- [ ] Aplicação Node.js inicia corretamente
- [ ] Migrations executadas com sucesso
- [ ] Seeds executados com sucesso

### Fase 2: Interface Web

#### Dashboard de Eventos (`/`)

- [ ] Página carrega sem erros
- [ ] Filtro por provedor funciona
- [ ] Filtro por tipo de evento funciona
- [ ] Filtro por data funciona
- [ ] Paginação funciona
- [ ] Detalhes do evento são exibidos

#### Gerenciamento de API Keys (`/api-keys`)

- [ ] Página carrega sem erros
- [ ] Formulário de criação funciona
- [ ] API key é gerada e exibida
- [ ] Chaves são listadas (mascaradas)
- [ ] Botão "Revoke" funciona

### Fase 3: API de Ingestão

#### Teste com MessageFlow

```bash
# Substitua YOUR_MESSAGEFLOW_API_KEY pela chave gerada
curl -X POST http://localhost:3000/webhooks/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_MESSAGEFLOW_API_KEY" \
  -d '{
    "event_id": "mf_evt_test_001",
    "event_type": "message.inbound",
    "timestamp": "2025-12-03T23:00:00Z",
    "data": {
      "message_id": "mf_msg_test_001",
      "sender": {
        "id": "usr_test_001",
        "name": "Test User"
      },
      "recipient": {
        "id": "acc_test_001"
      },
      "content": {
        "type": "text",
        "body": "Hello from MessageFlow test!"
      }
    }
  }'
```

**Resultado esperado:**
```json
{
  "status": "success",
  "message": "Event ingested successfully",
  "event_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

- [ ] Retorna status 200
- [ ] Retorna event_id
- [ ] Evento aparece no dashboard

#### Teste com ChatRelay

```bash
curl -X POST http://localhost:3000/webhooks/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_CHATRELAY_API_KEY" \
  -d '{
    "id": "cr-test-001",
    "type": "INCOMING_MESSAGE",
    "created_at": 1733270400,
    "payload": {
      "msg_ref": "cr-msg-test-001",
      "platform": "WHATSAPP",
      "from": "+5511999999999",
      "from_name": "Test User",
      "to": "+5511888888888",
      "message": {
        "format": "TEXT",
        "text": "Hello from ChatRelay test!"
      }
    }
  }'
```

- [ ] Retorna status 200
- [ ] Evento aparece no dashboard

#### Teste de Idempotência

```bash
# Primeira vez - deve criar o evento
curl -X POST http://localhost:3000/webhooks/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "event_id": "mf_evt_idempotency_test",
    "event_type": "message.inbound",
    "timestamp": "2025-12-03T23:00:00Z",
    "data": {
      "message_id": "mf_msg_idem",
      "sender": {"id": "usr_001", "name": "User"},
      "recipient": {"id": "acc_001"},
      "content": {"type": "text", "body": "Idempotency test"}
    }
  }'

# Segunda vez - deve retornar duplicate
curl -X POST http://localhost:3000/webhooks/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "event_id": "mf_evt_idempotency_test",
    "event_type": "message.inbound",
    "timestamp": "2025-12-03T23:00:00Z",
    "data": {
      "message_id": "mf_msg_idem",
      "sender": {"id": "usr_001", "name": "User"},
      "recipient": {"id": "acc_001"},
      "content": {"type": "text", "body": "Idempotency test"}
    }
  }'
```

**Segunda requisição deve retornar:**
```json
{
  "status": "success",
  "message": "Event already exists (idempotent)",
  "duplicate": true
}
```

- [ ] Primeira requisição cria evento
- [ ] Segunda requisição retorna duplicate: true
- [ ] Apenas um evento existe no banco

#### Teste de Autenticação

```bash
# Sem API key - deve retornar 401
curl -X POST http://localhost:3000/webhooks/ingest \
  -H "Content-Type: application/json" \
  -d '{"event_id": "test"}'

# API key inválida - deve retornar 401
curl -X POST http://localhost:3000/webhooks/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: invalid_key_123" \
  -d '{"event_id": "test"}'
```

- [ ] Sem API key retorna 401
- [ ] API key inválida retorna 401

### Fase 4: API de Consulta

#### Listar Eventos

```bash
# Listar todos os eventos
curl http://localhost:3000/api/events

# Com paginação
curl "http://localhost:3000/api/events?page=1&page_size=10"

# Filtrar por provedor
curl "http://localhost:3000/api/events?provider_id=PROVIDER_UUID"

# Filtrar por tipo
curl "http://localhost:3000/api/events?event_type=message.inbound"
```

- [ ] Lista eventos corretamente
- [ ] Paginação funciona
- [ ] Filtros funcionam

### Fase 5: API de Gerenciamento de Keys

#### Criar API Key

```bash
curl -X POST http://localhost:3000/api/keys \
  -H "Content-Type: application/json" \
  -d '{
    "provider_id": "PROVIDER_ID",
    "name": "Test Key"
  }'
```

- [ ] Cria API key com sucesso
- [ ] Retorna chave completa (apenas uma vez)

#### Listar e Revogar

```bash
# Listar
curl http://localhost:3000/api/keys

# Revogar
curl -X DELETE http://localhost:3000/api/keys/KEY_ID
```

- [ ] Lista chaves mascaradas
- [ ] Revoga chave com sucesso

### Fase 6: Performance

```bash
time curl -X POST http://localhost:3000/webhooks/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "event_id": "perf_test_001",
    "event_type": "message.inbound",
    "timestamp": "2025-12-03T23:00:00Z",
    "data": {
      "message_id": "msg_001",
      "sender": {"id": "usr_001", "name": "User"},
      "recipient": {"id": "acc_001"},
      "content": {"type": "text", "body": "Performance test"}
    }
  }'
```

- [ ] Resposta em menos de 200ms

## 🐛 Troubleshooting

### Docker não inicia

```bash
docker compose logs
docker compose build --no-cache
docker compose up
```

### Banco de dados não conecta

```bash
docker compose ps
docker compose restart db
```

### Migrations não executam

```bash
npm run migrate
```

## ✅ Critérios de Sucesso

O projeto está completo quando:

1. ✅ Docker Compose inicia sem erros
2. ✅ Migrations e seeds executam com sucesso
3. ✅ Interface web carrega e é navegável
4. ✅ Webhooks são ingeridos com sucesso
5. ✅ Normalização funciona para ambos os provedores
6. ✅ Idempotência previne duplicatas
7. ✅ Autenticação bloqueia requisições inválidas
8. ✅ APIs de consulta retornam dados corretos
9. ✅ API keys podem ser criadas e revogadas
10. ✅ Performance está dentro do esperado (< 200ms)
