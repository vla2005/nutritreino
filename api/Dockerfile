# syntax=docker/dockerfile:1
FROM dunglas/frankenphp:1-php8.4-alpine AS php-base

RUN install-php-extensions pdo_mysql intl pcntl

FROM php-base AS composer-base
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

WORKDIR /app
ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_MAX_PARALLEL_HTTP=4 \
    COMPOSER_PROCESS_TIMEOUT=600 \
    COMPOSER_CACHE_DIR=/tmp/composer-cache
FROM composer-base AS vendor
# Source changes do not invalidate the dependency installation layer.
COPY composer.json composer.lock ./
# composer-merge-plugin also reads the module manifests, not their source code.
COPY modules/Auth/composer.json ./modules/Auth/composer.json
COPY modules/Chat/composer.json ./modules/Chat/composer.json
COPY modules/Client/composer.json ./modules/Client/composer.json
COPY modules/MealPlan/composer.json ./modules/MealPlan/composer.json
COPY modules/Professional/composer.json ./modules/Professional/composer.json
COPY modules/User/composer.json ./modules/User/composer.json
RUN --mount=type=cache,target=/tmp/composer-cache composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --prefer-dist \
    --no-scripts \
    --no-autoloader

FROM vendor AS app-build
# Only application files enter the production image (never host storage/.env).
COPY app ./app
COPY bootstrap ./bootstrap
COPY config ./config
COPY database ./database
COPY modules ./modules
COPY public ./public
COPY resources ./resources
COPY routes ./routes
COPY artisan modules_statuses.json ./
RUN mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && composer dump-autoload --no-dev --optimize --no-interaction

# Explicit opt-in target; dev dependencies never enter production.
FROM app-build AS test
COPY docker/php.ini /usr/local/etc/php/conf.d/99-production.ini
RUN install-php-extensions gd
COPY tests ./tests
COPY phpunit.xml ./
COPY tests/container.env ./.env
RUN --mount=type=cache,target=/tmp/composer-cache composer install \
    --no-interaction --no-progress --prefer-dist --optimize-autoloader
ENV APP_ENV=testing \
    DB_CONNECTION=sqlite \
    DB_DATABASE=:memory: \
    CACHE_STORE=array \
    SESSION_DRIVER=array \
    QUEUE_CONNECTION=sync \
    MAIL_MAILER=array \
    BROADCAST_CONNECTION=null
HEALTHCHECK NONE
ENTRYPOINT []
CMD ["php", "vendor/bin/pest", "--ci"]

FROM php-base AS runtime-files

WORKDIR /app
COPY --from=app-build --chown=www-data:www-data /app /app
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY docker/php.ini /usr/local/etc/php/conf.d/99-production.ini
COPY docker/entrypoint.sh /usr/local/bin/nutritreino-entrypoint
COPY docker/healthcheck.php /usr/local/bin/nutritreino-healthcheck.php

RUN chmod +x /usr/local/bin/nutritreino-entrypoint \
    && mkdir -p storage/app/private storage/app/public storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && ln -sfn /app/storage/app/public /app/public/storage \
    && chown -R www-data:www-data storage bootstrap/cache

# Remove only build/debug tools, not PHP CLI, extensions or runtime libraries.
# A clean final filesystem avoids retaining removed binaries in base layers.
RUN rm -rf /usr/local/include/php /usr/local/lib/php/build \
    && rm -f /usr/local/bin/php-cgi /usr/local/bin/phpdbg \
        /usr/local/bin/phpize /usr/local/bin/php-config \
        /usr/local/bin/docker-php-ext-configure /usr/local/bin/docker-php-ext-install \
        /usr/local/bin/docker-php-ext-enable /usr/local/bin/docker-php-source \
        /usr/local/bin/install-php-extensions

FROM scratch AS production
COPY --from=runtime-files / /
WORKDIR /app
ENV PHP_INI_DIR=/usr/local/etc/php \
    GODEBUG=cgocheck=0 \
    XDG_CONFIG_HOME=/tmp/caddy/config \
    XDG_DATA_HOME=/tmp/caddy/data

USER www-data
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
    CMD ["php", "/usr/local/bin/nutritreino-healthcheck.php", "api"]

ENTRYPOINT ["nutritreino-entrypoint"]
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]
