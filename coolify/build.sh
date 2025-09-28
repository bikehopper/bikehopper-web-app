# make tippecanoe available globally
cp gtfs-processor/submodule-deps/tippecanoe/tippecanoe* /usr/local/bin/

# generate gtfs derived assets
npm run gtfs-process