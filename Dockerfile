# Production image: Node 22, install deps, build Vite app, prune devDependencies, run Express.
FROM node:22-bookworm

WORKDIR /app

# Install dependencies (including devDependencies required for `tsc` / `vite build`)
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

ENV NODE_ENV=production
RUN npm prune --omit=dev

ENV HOST=0.0.0.0
# EXPOSE documents the default container port; runtime uses process.env.PORT from the platform.
EXPOSE 10000

CMD ["npm", "start"]
