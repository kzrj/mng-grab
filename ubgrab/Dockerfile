# Образ для удалённой разработки Expo (Metro + Dev Tools)
# syntax=docker/dockerfile:1 — для BuildKit (cache mount); если не используется, уберите --mount ниже
FROM node:20-alpine

WORKDIR /app

# Установка зависимостей (кэшируется отдельным слоем)
# — progress и verbose: видим прогресс, чтобы не казалось, что сборка зависла
# — cache mount: ускоряет повторные сборки и снижает нагрузку на сеть
# — NODE_OPTIONS: лимит памяти для Node (1536 МБ для слабых машин; если RAM много — можно 3072)
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    NODE_OPTIONS=--max-old-space-size=1536 \
    npm ci --progress=true --loglevel=info

# Код приложения монтируется через volume в docker-compose
COPY . .

# Порты: 8081 — Metro, 19000/19001 — Expo Dev Tools
EXPOSE 8081 19000 19001

# Слушать на всех интерфейсах; хост пакетера задаётся через env (EXPO_PACKAGER_HOSTNAME)
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV CI=1

CMD ["npx", "expo", "start", "--lan", "--host", "0.0.0.0"]
