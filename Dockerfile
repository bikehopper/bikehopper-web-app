FROM node:18.12-alpine
WORKDIR /app
COPY package.json /app
COPY package-lock.json /app
RUN npm install
COPY ./src /app/src
EXPOSE 3001
CMD node /app/src/index.js
