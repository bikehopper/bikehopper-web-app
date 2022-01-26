# Graphhopper node app fascade

## How to use

Run the following commands to start the app. This requires Docker to be installed and running. It starts node with the `--inspect` flag.

- `git clone`
- `npm i`
- `npm s`

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
