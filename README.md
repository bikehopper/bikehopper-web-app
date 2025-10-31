# bikehopper-web-app

Lightweight Node.js proxy for BikeHopper backends. See
[bikehopper-ui](https://github.com/bikehopper/bikehopper-ui)

## How to setup

Prerequisites:
- Linux/debian_x64 environment (WSL Ubuntu works)
- npm and Node 22+ (for example, using [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)),

Then:
- `git clone` this repo
- `npm install` 
    - This will also install data dependencies like gtfs.zip
- `npm run build`
    - This will build artifacts from the data dependencies
- Setup Environment variables:
    - A maajor role of this service is to proxy requests from teh frontend to other services.
    - The URL's for these other services are setup via env vars
    - See `src/config.js` for more details
- `npm run start` To start  the server

# node-tippecanoe wonkiness
- We rely on a pre-compiled version of [tippecanoe](https://github.com/felt/tippecanoe) stored in the [node-tippecanoe](https://github.com/bikehopper/node-tippecanoe) repo.
- This is wired up as a `git` dependency in `package.json`
    - NPM's caching of git dependencies is too aggresive, so manually clearing and re-adding the dependency is needed.
    - Ensure the git tag, and the `package.json.version` are bumped in the `node-tippecanoe` repo
    - Delete the `@bikehopper/node-tippecanoe` in this repo's `package.json`
        - Run `npm install`
    - Re-add the `@bikehopper/node-tippecanoe` in this repo's `package.json` with the updated `#<version` at the end
        - Run `npm install`

## Routes

These routes are exposed via GraphHopper and accessible from this app. They are the routes this app proxies.
- GET     /health node app health check
- GET     /v1/graphhopper (com.graphhopper.application.resources.RootResource)
- GET     /v1/graphhopper/health (com.graphhopper.resources.HealthcheckResource)
- GET     /v1/graphhopper/i18n (com.graphhopper.resources.I18NResource)
- GET     /v1/graphhopper/i18n/{locale} (com.graphhopper.resources.I18NResource)
- GET     /v1/graphhopper/info (com.graphhopper.resources.InfoResource)
- GET     /v1/graphhopper/isochrone (com.graphhopper.resources.IsochroneResource)
- GET     /v1/graphhopper/isochrone-pt (com.graphhopper.resources.PtIsochroneResource)
- POST    /v1/graphhopper/match (com.graphhopper.resources.MapMatchingResource)
- GET     /v1/graphhopper/mvt/{z}/{x}/{y}.mvt (com.graphhopper.resources.MVTResource)
- GET     /v1/graphhopper/navigate/directions/v5/gh/{profile}/{coordinatesArray : .+} (com.graphhopper.navigation.NavigateResource)
- GET     /v1/graphhopper/nearest (com.graphhopper.resources.NearestResource)
- GET     /v1/graphhopper/pt-mvt/{z}/{x}/{y}.mvt (com.graphhopper.resources.PtMVTResource)
- GET     /v1/graphhopper/route (com.graphhopper.resources.RouteResource)
- POST    /v1/graphhopper/route (com.graphhopper.resources.RouteResource)
- GET     /v1/graphhopper/route-pt (com.graphhopper.resources.PtRouteResource)
- GET     /v1/graphhopper/spt (com.graphhopper.resources.SPTResource)

These routes are exposed from [Photon](https://photon.komoot.io/):
- GET /v1/photon/geocode?q=coffee&limit=1&lat=37.7749&lon=-122.4194&lang=en
- GET /v1/photon/reverse?lat=37.7749&lon=-122.4194



## GTFS processor

Ingests a static GTFS feed and outputs useful geoJSON files. It supports excluding stops by transit agency.

#### Output Files
* `transit-service-area.json`: A polygon that defines the area within which transit data is known.
* `route-line-lookup.json`: Dictionaries used at runtime by `bikehopper-web-app`.
    1. routeTripShapeLookup:
        This is a two-level dictionary
        Level1 :
            Key is a route-id, Value is the 2nd Level dictionary
        Level 2:
            Key is a trip-id, Value is a shape-id
    2. shapeIdLineStringLookup:
        Key is the shape-id of a route, and the value is a LineString of the entire route
    3. tripIdStopIdsLookup:
        Key is a trip-id, and value is an array of stop-ids for that trip
* `/route-tiles`: A `{z}/{x}/{y}` VectorTile tileset that contains LineStrings for all the routes in the GTFS feed
```
"vector_layers": [
    {
        "id": "route-lines",
        "description": "",
        "minzoom": 7,
        "maxzoom": 14,
        "fields": {
            "route_color": "String",
            "route_id": "String",
            "route_text_color": "String",
            "trip_ids": "String"
        }
    }
],
```
* `/stop-tiles`: A `{z}/{x}/{y}` VectorTile tileset that contains the Points of all the Stops in the GTFS feed
```
"vector_layers": [
    {
        "id": "stops",
        "description": "",
        "minzoom": 8,
        "maxzoom": 14,
        "fields": {
            // Encoding the types of modalities at the stop
            // Keys are taken from https://gtfs.org/documentation/schedule/reference/#routestxt
            "tram": "Boolean",
            "subway": "Boolean",
            "rail": "Boolean",
            "bus": "Boolean",
            "ferry": "Boolean",
            "cable": "Boolean",
            "aerial": "Boolean",
            "funicular": "Boolean",
            "trolleybus": "Boolean",
            "monorail": "Boolean",

            "stop_id": "String",
            "stop_name": "String",
        }
    }
],
```
