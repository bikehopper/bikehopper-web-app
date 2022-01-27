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
- GET     / (com.graphhopper.application.resources.RootResource)
- GET     /health (com.graphhopper.resources.HealthcheckResource)
- GET     /i18n (com.graphhopper.resources.I18NResource)
- GET     /i18n/{locale} (com.graphhopper.resources.I18NResource)
- GET     /info (com.graphhopper.resources.InfoResource)
- GET     /isochrone (com.graphhopper.resources.IsochroneResource)
- GET     /isochrone-pt (com.graphhopper.resources.PtIsochroneResource)
- POST    /match (com.graphhopper.resources.MapMatchingResource)
- GET     /mvt/{z}/{x}/{y}.mvt (com.graphhopper.resources.MVTResource)
- GET     /navigate/directions/v5/gh/{profile}/{coordinatesArray : .+} (com.graphhopper.navigation.NavigateResource)
- GET     /nearest (com.graphhopper.resources.NearestResource)
- GET     /pt-mvt/{z}/{x}/{y}.mvt (com.graphhopper.resources.PtMVTResource)
- GET     /route (com.graphhopper.resources.RouteResource)
- POST    /route (com.graphhopper.resources.RouteResource)
- GET     /route-pt (com.graphhopper.resources.PtRouteResource)
- GET     /spt (com.graphhopper.resources.SPTResource)
