FROM node:20-alpine

WORKDIR /app

# Копируем package.json и package-lock.json для установки зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код приложения в контейнер
COPY . .

ENV PORT=3000

EXPOSE $PORT

# Указываем команду для запуска приложения
CMD ["npm", "start"]
