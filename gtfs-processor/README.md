# GTFS Processor

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

## Getting Started

Clone this repo, set values in a `.env` file, then run `docker compose up`.

1. Clone this repo
2. Run `cp .env.example .env`. Fill `FILTERED_AGENCY_IDS` and `MANUALLY_FILTERED_ROUTE_IDS` with a comma seprated list of agency IDs you'd like to exclude. You can leave these blank if you dont know.
3. Run `docker compose up`, if it exists succesfully check `./volumes/output` for JSON.
