FROM node:lts-alpine
WORKDIR /app
COPY package.json .
ENV NODE_ENV='production'
RUN apk --no-cache add git
RUN npm install
COPY --chown=node:node . .
USER node
CMD ["node", "src/index.js"]