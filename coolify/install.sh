mkdir -p input
npx --yes @bikehopper/data-mirror -f gtfs -o input # download data
npm install
npm run gtfs-process
