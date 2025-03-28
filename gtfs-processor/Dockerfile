FROM ubuntu:22.04 AS tippecanoe-builder
RUN apt-get update && apt-get -y install gcc g++ make libsqlite3-dev zlib1g-dev
COPY ./submodule-deps /app/submodule-deps
WORKDIR /app/submodule-deps/tippecanoe
RUN make

FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get -y install dumb-init libsqlite3-dev zlib1g-dev
COPY --from=tippecanoe-builder /app/submodule-deps/tippecanoe/tippecanoe* /usr/local/bin/
COPY --from=tippecanoe-builder /app/submodule-deps/tippecanoe/tile-join /usr/local/bin/
COPY package.json /app
COPY package-lock.json /app
COPY ./src /app/src
RUN npm ci
ENTRYPOINT ["/usr/bin/dumb-init", "--"]