# bikehopper-web-app

Lightweight Node.js proxy for BikeHopper backends. See
[bikehopper-ui](https://github.com/bikehopper/bikehopper-ui)

## How to setup

Install these prerequisites:
- npm and Node 18+ (for example, using [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)),
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
