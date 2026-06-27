# Production image: Node 22 backend API only (React frontend is served by Vercel).
FROM node:22-bookworm

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
RUN npm prune --omit=dev

ENV HOST=0.0.0.0
# EXPOSE documents the default container port; runtime uses process.env.PORT from the platform.
EXPOSE 10000

CMD ["npm", "run", "server"]
