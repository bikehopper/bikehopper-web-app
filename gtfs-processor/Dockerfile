FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install dumb-init
COPY package.json /app
COPY package-lock.json /app
COPY ./src /app/src
RUN npm ci
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD node /app/src/generateLocalTransitBounds.js
