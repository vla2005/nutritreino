# syntax=docker/dockerfile:1
FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm ci --no-audit --no-fund --prefer-offline

COPY . .
ARG VITE_API_ORIGIN
ARG VITE_PUSHER_APP_KEY
ARG VITE_PUSHER_APP_CLUSTER=mt1
ENV VITE_API_ORIGIN=$VITE_API_ORIGIN \
    VITE_PUSHER_APP_KEY=$VITE_PUSHER_APP_KEY \
    VITE_PUSHER_APP_CLUSTER=$VITE_PUSHER_APP_CLUSTER
RUN npm run build

FROM nginx:1.28-alpine-slim
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
