# Образ для удалённой разработки Expo (Metro + Dev Tools)
FROM node:20-alpine

WORKDIR /app

# Установка зависимостей (кэшируется отдельным слоем)
COPY package.json package-lock.json* ./
RUN npm ci

# Код приложения монтируется через volume в docker-compose
COPY . .

# Порты: 8081 — Metro, 19000/19001 — Expo Dev Tools
EXPOSE 8081 19000 19001

# Слушать на всех интерфейсах; хост пакетера задаётся через env (EXPO_PACKAGER_HOSTNAME)
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV CI=1

CMD ["npx", "expo", "start", "--lan", "--host", "0.0.0.0"]
