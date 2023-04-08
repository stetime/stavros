FROM node:alpine
WORKDIR /app
COPY package*.json ./
ENV NODE_ENV='production'
RUN npm ci --only=production
USER node
COPY --chown=node:node . .
CMD ["node", "index.js"]