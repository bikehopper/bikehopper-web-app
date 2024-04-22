FROM node:20.12-alpine
WORKDIR /app
RUN apk --no-cache add curl dumb-init
COPY package.json /app
COPY package-lock.json /app
RUN npm install
COPY ./src /app/src
EXPOSE 3001
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD node /app/src/index.js
