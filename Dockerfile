FROM node:alpine
WORKDIR /app
COPY package*.json ./
ENV NODE_ENV='production'
RUN npm install
RUN npm update
COPY . .
RUN node src/deployCommands.js
CMD ["node", "./src/index.js"]
