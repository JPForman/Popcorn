# Build with: docker build -f server/Dockerfile .   (context = repo root, needs shared/ + server/)

FROM node:20-alpine AS build
# Prisma's query engine needs openssl on alpine/musl at generate-time too, so the
# binary target it picks matches what's actually available in the runtime stage.
RUN apk add --no-cache openssl
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY shared/package.json shared/package.json
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci

COPY shared shared
COPY server server
RUN npm run build -w shared
RUN npm run build -w server

FROM node:20-alpine AS runtime
# Prisma's query engine needs openssl on alpine/musl.
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules node_modules
COPY --from=build /app/package.json package.json
COPY --from=build /app/shared/package.json shared/package.json
COPY --from=build /app/shared/dist shared/dist
COPY --from=build /app/server/package.json server/package.json
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/server/prisma server/prisma

WORKDIR /app/server
EXPOSE 8080
CMD ["node", "dist/index.js"]
