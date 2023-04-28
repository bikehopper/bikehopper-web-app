FROM node:18.12-alpine as build
WORKDIR /app
COPY package.json /app
COPY package-lock.json /app
COPY ./src /app/src
RUN npm ci --omit=dev

# FROM node:18.12-alpine
FROM gcr.io/distroless/nodejs18-debian11
COPY --from=build /app /app
EXPOSE 3001
CMD node /app/src/index.js
