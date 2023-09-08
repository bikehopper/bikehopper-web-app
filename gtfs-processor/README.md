# GTFS Processor

Ingests a static GTFS feed and outputs useful geoJSON files. It supports excluding stops by transit agency.

#### Output Files
* `bounding-box.json` Used to define a default viewport by [bounding box](https://turfjs.org/docs/#bbox).
* `center-area.json` Used to define a default viewport by [center](https://turfjs.org/docs/#centerOfMass) lat/lng and zoom level (define this in your app).
* `buffered-hull.json` Used to figure out the above values and can be useful for other things. [docs](https://turfjs.org/docs/#buffer)

## Getting Started

Clone this repo, set values in a `.env` file, then run `docker compose up`.

1. Clone this repo
2. Run `cp .env.example .env`. Fill `FILTERED_AGENCY_IDS` and `MANUALLY_FILTERED_ROUTE_IDS` with a comma seprated list of agency IDs you'd like to exclude. You can leave these blank if you dont know.
3. Run `docker compose up`, if it exists succesfully check `./volumes/output` for JSON.
