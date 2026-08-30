# Node 24: SQLite comes from the built-in node:sqlite module
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json tsconfig.client.json ./
COPY src ./src
COPY client ./client
COPY test ./test
RUN npm run build && npm prune --omit=dev

FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/public/js ./public/js
COPY public/styles.css ./public/styles.css
RUN mkdir -p /app/data /data && chown -R node:node /app/data /data
EXPOSE 3000
USER node
CMD ["node", "dist/src/server.js"]
