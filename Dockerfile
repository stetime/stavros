FROM oven/bun:alpine
WORKDIR /app
COPY package.json bun.lock ./
ENV NODE_ENV='production'
RUN apk --no-cache add git
RUN bun install --frozen-lockfile --production
COPY --chown=bun:bun . .
USER bun
CMD ["bun", "run", "src/index.ts"]