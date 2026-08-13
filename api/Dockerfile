# syntax=docker/dockerfile:1
FROM composer:2 AS vendor

WORKDIR /app
ENV COMPOSER_MAX_PARALLEL_HTTP=4 \
    COMPOSER_PROCESS_TIMEOUT=600 \
    COMPOSER_CACHE_DIR=/tmp/composer-cache
COPY . .
RUN --mount=type=cache,target=/tmp/composer-cache composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --optimize-autoloader

FROM dunglas/frankenphp:1-php8.4-alpine

RUN install-php-extensions pdo_mysql intl pcntl

WORKDIR /app
COPY --from=vendor --chown=www-data:www-data /app /app
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY docker/php.ini /usr/local/etc/php/conf.d/99-production.ini
COPY docker/entrypoint.sh /usr/local/bin/nutritreino-entrypoint

RUN chmod +x /usr/local/bin/nutritreino-entrypoint \
    && mkdir -p storage/app/private storage/app/public storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && ln -sfn /app/storage/app/public /app/public/storage \
    && chown -R www-data:www-data storage bootstrap/cache

ENV XDG_CONFIG_HOME=/tmp/caddy/config \
    XDG_DATA_HOME=/tmp/caddy/data

USER www-data
EXPOSE 8080

ENTRYPOINT ["nutritreino-entrypoint"]
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]
