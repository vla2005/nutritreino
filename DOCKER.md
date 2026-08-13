# NutriTreino com Docker

Esta configuracao executa somente quatro containers permanentes:

- `web`: Nginx Alpine servindo o build estatico do React e encaminhando `/api` e `/storage`.
- `api`: Laravel em FrankenPHP/Caddy, com OPcache habilitado.
- `queue`: a mesma imagem da API, processando notificacoes e convites em segundo plano.
- `database`: MySQL 8.4 LTS para dados, sessoes, cache e fila.

O servico `migrate` e temporario: executa as migrations e encerra antes da API iniciar. Node, Composer e compiladores existem apenas nos estagios de build e nao ficam nas imagens finais. Redis nao e necessario neste porte porque o sistema ja usa o banco para cache e fila.

## Inicio rapido

```powershell
Copy-Item .env.docker.example .env.docker
docker compose --env-file .env.docker up -d --build
```

A aplicacao ficara em `http://localhost:8080`. Acompanhe o estado com:

```powershell
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f api queue
```

Quando `APP_KEY` estiver vazio, a primeira migration gera uma chave segura e a salva no volume persistente `api_storage`. Defina `APP_KEY` explicitamente no ambiente se preferir gerenciar o segredo fora do Docker.

## Producao

Antes de publicar, altere `DOCKER_DB_PASSWORD`, `APP_URL`, `CORS_ALLOWED_ORIGINS` e `SANCTUM_STATEFUL_DOMAINS`. As variaveis `DOCKER_DB_*` sao intencionalmente separadas de `DB_*` para que `api/.env` nao sobrescreva as credenciais internas dos containers. Coloque TLS em um proxy reverso externo (Caddy, Traefik ou o proxy da plataforma) apontando para a porta configurada por `WEB_PORT`.

Para chat e video em tempo real, configure as quatro variaveis `PUSHER_*`, mude `BROADCAST_CONNECTION=pusher` e reconstrua o frontend. Para envio real de emails, configure as variaveis `MAIL_*` e altere `MAIL_MAILER` para o transporte usado.

Uploads e a chave gerada ficam em `api_storage`; os dados do MySQL ficam em `database_data`. Inclua os dois volumes em sua rotina de backup.

## Comandos uteis

```powershell
# Recriar apos alteracoes de codigo
docker compose --env-file .env.docker up -d --build

# Executar comandos Artisan
docker compose --env-file .env.docker exec api php artisan about

# Parar sem apagar dados
docker compose --env-file .env.docker down
```

Nao use `docker compose down -v` em um ambiente com dados importantes: a opcao `-v` remove o banco e os uploads persistidos.
