# HookHubTS - Webhook Gateway Service (Node.js/Express)

## Visão Geral do Projeto

Serviço gateway de webhooks que recebe eventos de múltiplos provedores externos (MessageFlow e ChatRelay), normaliza os dados em um schema unificado, persiste no PostgreSQL e fornece API + interface web para gerenciamento.

---

## Checklist de Desenvolvimento

### [ ] 1. Setup Inicial do Projeto

- [ ] Inicializar repositório Git (`git init`)
- [ ] Criar estrutura de diretórios do projeto (src, dist, etc)
- [ ] Inicializar projeto Node.js (`npm init`) e configurar TypeScript
- [ ] Instalar dependências (Express, pg, dotenv, etc)
- [ ] Configurar ESLint e Prettier
- [ ] Setup Docker Compose (PostgreSQL + App)
- [ ] Configurar variáveis de ambiente (.env)
- [ ] Criar README preliminar

### [ ] 2. Modelagem e Banco de Dados

- [ ] Desenhar schema normalizado para eventos
- [ ] Configurar conexão com PostgreSQL (pg ou query builder/ORM)
- [ ] Criar script de migração para tabela `providers`
- [ ] Criar script de migração para tabela `api_keys`
- [ ] Criar script de migração para tabela `events`
- [ ] Adicionar índices para performance
- [ ] Implementar constraint de idempotência

### [ ] 3. API de Ingestão de Webhooks

- [ ] Criar endpoint POST `/webhooks/ingest`
- [ ] Implementar parser para Provedor A (MessageFlow)
- [ ] Implementar parser para Provedor B (ChatRelay)
- [ ] Normalizar payloads para schema unificado
- [ ] Validar estrutura dos payloads (Zod)
- [ ] Implementar resposta rápida (< 200ms)
- [ ] Persistir eventos no PostgreSQL
- [ ] Garantir idempotência (tratar erro de chave única)
- [ ] Adicionar logging de eventos recebidos
- [ ] Tratamento de erros e validações

### [ ] 4. Sistema de Autenticação (API Keys)

- [ ] Criar middleware de autenticação
- [ ] Validar API key no header das requisições
- [ ] Vincular API key ao provedor específico
- [ ] Retornar HTTP 401 para chaves inválidas
- [ ] Retornar HTTP 403 para chaves expiradas
- [ ] Implementar geração de API keys (hash seguro)

### [ ] 5. API de Consulta de Eventos

- [ ] Criar endpoint GET `/api/events`
- [ ] Implementar filtros:
  - [ ] Por provedor
  - [ ] Por tipo de evento
  - [ ] Por intervalo de tempo
- [ ] Implementar paginação
- [ ] Retornar dados em JSON

### [ ] 6. API de Gerenciamento de API Keys

- [ ] Criar endpoint POST `/api/keys` (criar nova chave)
- [ ] Criar endpoint GET `/api/keys` (listar chaves)
- [ ] Criar endpoint DELETE `/api/keys/:id` (revogar chave)
- [ ] Mascarar valor da chave após criação

### [ ] 7. Interface Web de Gerenciamento

- [ ] Setup do frontend (EJS + TailwindCSS + DaisyUI)
- [ ] Configurar PostCSS e Tailwind
- [ ] Criar layout responsivo com DaisyUI
- [ ] **Histórico de Eventos:**
  - [ ] Listar eventos com paginação
  - [ ] Filtros (Provedor, Tipo, Data)
  - [ ] Exibir detalhes do evento
- [ ] **Gerenciamento de API Keys:**
  - [ ] Formulário para criar nova chave
  - [ ] Listar chaves existentes
  - [ ] Revogar chaves

### [ ] 8. Docker e Infraestrutura

- [ ] Criar Dockerfile para aplicação Node.js
- [ ] Criar docker-compose.yml
- [ ] Configurar healthchecks
- [ ] Testar `docker compose up`

### [ ] 9. Testes e Validação

- [ ] Configurar framework de testes (Jest/Vitest)
- [ ] Testar ingestão e normalização
- [ ] Testar idempotência
- [ ] Testar autenticação
- [ ] Testar APIs de consulta
- [ ] Validar performance

### [ ] 10. Documentação e Entregáveis

- [ ] README com:
  - [ ] Como configurar e executar via Docker
  - [ ] Como executar os testes
  - [ ] Exemplos de comandos curl para webhook
- [ ] Garantir código no repositório Git
- [ ] Verificar critérios: Simplicidade, Performance, Segurança, Produção
