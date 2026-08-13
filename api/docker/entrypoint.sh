#!/bin/sh
set -eu

mkdir -p \
    storage/app/private \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache

if [ -z "${APP_KEY:-}" ]; then
    key_file="storage/app/.app_key"

    if [ ! -s "$key_file" ]; then
        umask 077
        generated_key="base64:$(php -r 'echo base64_encode(random_bytes(32));')"
        printf '%s' "$generated_key" > "$key_file"
    fi

    APP_KEY="$(cat "$key_file")"
    export APP_KEY
fi

php artisan config:cache --no-interaction

exec "$@"
