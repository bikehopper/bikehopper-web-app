# download data into input dir
mkdir -p input
npx --yes @bikehopper/data-mirror -f gtfs,region_config,elevators -o input 

#compile tippecanoe
apt-get update && apt-get -y install gcc g++ make libsqlite3-dev zlib1g-dev
(cd gtfs-processor/submodule-deps/tippecanoe && make)

#install node dependencies
npm install
