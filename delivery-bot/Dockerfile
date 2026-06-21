FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY src/ ./src/
COPY config.json* ./

ENV NODE_ENV=production

CMD ["npm", "start"]
