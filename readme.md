# bikehopper-web-app

## How to setup

Install these prerequisites:
- npm and Node 14+ (for example, using [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)),
- Docker (for example, using Docker Desktop for [Windows](https://docs.docker.com/desktop/windows/install/), [Mac](https://docs.docker.com/desktop/mac/install/))

Then:
- `git clone` this repo
- `npm install`
- Ensure Docker Desktop or another Docker daemon is running.

## How to use

Run `npm start` to start the app. The Node server will start printing logs to the console.

In another terminal, `curl localhost:3000/health` to ensure the server is performing correctly.

The v1 api is available at `curl localhost:3000/api/v1/bikehopper/<route>`.

## Routes

These routes are exposed via Graphhopper and accessible from this app. They are the routes this app proxies.
- GET     /health node app health check
- GET     /v1/ (com.graphhopper.application.resources.RootResource)
- GET     /v1/health (com.graphhopper.resources.HealthcheckResource)
- GET     /v1/i18n (com.graphhopper.resources.I18NResource)
- GET     /v1/i18n/{locale} (com.graphhopper.resources.I18NResource)
- GET     /v1/info (com.graphhopper.resources.InfoResource)
- GET     /v1/isochrone (com.graphhopper.resources.IsochroneResource)
- GET     /v1/isochrone-pt (com.graphhopper.resources.PtIsochroneResource)
- POST    /v1/match (com.graphhopper.resources.MapMatchingResource)
- GET     /v1/mvt/{z}/{x}/{y}.mvt (com.graphhopper.resources.MVTResource)
- GET     /v1/navigate/directions/v5/gh/{profile}/{coordinatesArray : .+} (com.graphhopper.navigation.NavigateResource)
- GET     /v1/nearest (com.graphhopper.resources.NearestResource)
- GET     /v1/pt-mvt/{z}/{x}/{y}.mvt (com.graphhopper.resources.PtMVTResource)
- GET     /v1/route (com.graphhopper.resources.RouteResource)
- POST    /v1/route (com.graphhopper.resources.RouteResource)
- GET     /v1/route-pt (com.graphhopper.resources.PtRouteResource)
- GET     /v1/spt (com.graphhopper.resources.SPTResource)

These routes are exposed from [Photon](https://photon.komoot.io/):
- GET /v2/geocode?q=coffee&limit=1&lat=37.7749&lon=-122.4194&lang=en
- GET /v2/reverse?lat=37.7749&lon=-122.4194
