# bikehopper-web-app

Lightweight Node.js proxy for BikeHopper backends. See
[bikehopper-ui](https://github.com/bikehopper/bikehopper-ui)

## How to setup

Install these prerequisites:
- npm and Node 22+ (for example, using [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)),
- Docker (for example, using Docker Desktop for [Windows](https://docs.docker.com/desktop/windows/install/), [Mac](https://docs.docker.com/desktop/mac/install/))

Then:
- `git clone` this repo
- `npm install`
- Ensure Docker Desktop or another Docker daemon is running.

## How to use

Run `npm start` to start the app. The Node server will start printing logs to the console.

In another terminal, `curl localhost:3001/health` to ensure the server is performing correctly.

The routing api is available at `curl localhost:3001/v1/graphhopper/<route>`.

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

## Getting Started with the GTFS Processor

(TODO: Update these instructions)

Clone this repo, set values in a `.env` file, then run `docker compose up`.

1. Clone this repo
2. Run `cp .env.example .env`. Fill `FILTERED_AGENCY_IDS` and `MANUALLY_FILTERED_ROUTE_IDS` with a comma seprated list of agency IDs you'd like to exclude. You can leave these blank if you dont know.
3. Run `docker compose up`, if it exists succesfully check `./volumes/output` for JSON.
