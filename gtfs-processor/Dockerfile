FROM node:20
WORKDIR /app
COPY package.json /app
COPY package-lock.json /app
COPY ./src /app/src
RUN npm install
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD node /app/src/generateLocalTransitBounds.js
