# NutriTreino com Docker

Esta configuracao executa somente quatro containers permanentes:

- `web`: Nginx Alpine servindo o build estatico do React e encaminhando `/api` e `/storage`.
- `api`: Laravel em FrankenPHP/Caddy, com OPcache habilitado.
- `queue`: a mesma imagem da API, processando notificacoes e convites em segundo plano.
- `database`: MySQL 8.4 LTS para dados, sessoes, cache e fila.

O servico `migrate` e temporario: executa as migrations e encerra antes da API iniciar. Node, Composer e compiladores existem apenas nos estagios de build e nao ficam nas imagens finais. Redis nao e necessario neste porte porque o sistema ja usa o banco para cache e fila.

## Imagens otimizadas

A API instala as dependencias antes de copiar o codigo: alterar um controller nao reinstala o Composer. O build usa a mesma versao do PHP e as mesmas extensoes da execucao, sem ignorar requisitos de plataforma. A imagem final copia somente os arquivos da aplicacao e o filesystem de execucao, sem PHP CGI, phpdbg, headers ou ferramentas de compilacao. PHP CLI, FrankenPHP, PDO MySQL, intl, pcntl, OPcache, certificados e bibliotecas do sistema foram mantidos.

O frontend usa `nginx:1.28-alpine-slim`, mantendo o build React, as fontes, as imagens, o proxy e os uploads. Node e npm permanecem apenas no build. Os arquivos `.env*`, caches locais, bancos SQLite e uploads do host sao excluidos do contexto da API; nao sao apagados do host nem dos volumes. Para adicionar extensoes PHP, altere o estagio `php-base` e reconstrua a imagem.

Os healthchecks de API e fila verificam conexao autenticada com MySQL e diretorios gravaveis. A API tambem verifica `/up`; a fila verifica o processo `queue:work`. Eles nao comprovam entrega de email nem a execucao bem-sucedida de cada job. O estado `unhealthy` e diagnostico: o Docker nao reinicia automaticamente um processo que continua vivo somente por esse estado.

## Testes isolados e verificacao

O alvo `test` e separado da producao. Somente ele inclui Pest, PHPUnit, GD para gerar imagens ficticias e um `.env` de teste com chave publica ficticia. Nao publique `nutritreino-api:test` como imagem de producao.

```powershell
# Suite em SQLite em memoria, sem volumes do sistema
docker build --target test -t nutritreino-api:test api
docker run --rm nutritreino-api:test

# Mesma suite com MySQL descartavel, rede propria e dados em tmpfs
docker compose -f docker-compose.test.yml build tests
docker compose -f docker-compose.test.yml run --rm -T tests
docker compose -f docker-compose.test.yml down

# Estado, migrations, rotas HTTP e todos os assets do frontend em execucao
./scripts/Test-Docker.ps1
```

A suite cobre cadastro, verificacao positiva de email, login/logout, dashboards, perfis, convites de clientes novos e existentes, dieta e treino para convite pendente, progresso com foto e feedback, permissoes de chat e anexos criptografados, sinalizacao de videochamada, rascunhos de IA e processamento de um job real da fila de banco. Notificacoes, eventos externos e respostas Gemini sao simulados. A entrega real por SMTP, a qualidade da resposta Gemini e audio/video entre dois navegadores precisam de validacao externa; esta suite nao os certifica. Ela tambem nao certifica validade/uso unico do token de verificacao de email.

### Validacao executada em 07/10/2026

Tamanhos reportados por `docker image inspect` (MB decimais):

| Imagem | Antes | Depois |
| --- | ---: | ---: |
| API (compartilhada com fila e migrations) | 88,85 MB | 77,74 MB |
| Web | 26,63 MB | 6,37 MB |
| Total das duas imagens | 115,48 MB | 84,12 MB |

Reducao total aproximada de 27%. Foram aprovados 21 testes/116 assercoes em SQLite e os mesmos 21 testes/116 assercoes em MySQL isolado. No ambiente principal, database, api, queue e web ficaram `healthy`, migrate encerrou com codigo 0, cinco rotas publicas responderam 200, oito rotas protegidas responderam 401 sem autenticacao e os 67 assets responderam 200. Os healthchecks tambem falharam corretamente em containers descartaveis sem servidor/worker. As contagens dos registros de negocio foram iguais antes e depois; os volumes originais nao foram removidos. Somente o banco descartavel de testes, em tmpfs, e sua rede foram removidos ao final.

O teste antigo de progresso foi atualizado para a regra atual (cliente registra; profissional autorizado consulta e envia feedback). Nenhuma regra de negocio foi alterada nesta otimizacao.

Referencias da estrutura de build: [multi-stage](https://docs.docker.com/build/building/multi-stage/) e [cache de dependencias](https://docs.docker.com/build/cache/optimize/).

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
