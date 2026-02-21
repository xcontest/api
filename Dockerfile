FROM node:22.16.0-alpine3.22 AS base

# Install pnpm 
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate


# Install development and build dependencies
FROM base AS deps
WORKDIR /app
ADD package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Install only production dependencies
FROM base AS production-deps
WORKDIR /app
ADD package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Build the application
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
ADD . .
RUN pnpm exec node ace build

# Final stage for development
FROM base AS dev
ENV NODE_ENV=development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
ADD . .
EXPOSE 3333
CMD ["pnpm", "run", "dev"]

# Final stage for production
FROM base AS prod
ENV NODE_ENV=production
WORKDIR /app
COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app
EXPOSE 3333
CMD ["pnpm", "start"]
