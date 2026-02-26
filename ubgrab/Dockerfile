# Образ для удалённой разработки Expo (Metro + Dev Tools)
# syntax=docker/dockerfile:1 — для BuildKit (cache mount); если не используется, уберите --mount ниже
FROM node:20-alpine

WORKDIR /app

# Установка зависимостей (кэшируется отдельным слоем)
# Для US (Iowa и т.д.) оставляем registry.npmjs.org. Если качает по часу на пакет — проверьте лимиты egress/сети в GCP.
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    NODE_OPTIONS=--max-old-space-size=1536 \
    npm ci --progress=true --loglevel=info

# Код приложения монтируется через volume в docker-compose
COPY . .

# Порты: 8081 — Metro, 19000/19001 — Expo Dev Tools
EXPOSE 8081 19000 19001

# Слушать на всех интерфейсах; хост пакетера задаётся через env (EXPO_PACKAGER_HOSTNAME)
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV CI=1

CMD ["npx", "expo", "start", "--host", "0.0.0.0"]
