FROM node:lts-alpine
WORKDIR /app
COPY package.json .
ENV NODE_ENV='production'
RUN npm ci --only=production
COPY --chown=node:node . .
USER node
CMD ["node", "index.js"]