import * as z from 'zod';

export const RouteLinestringLookupParser = z.object( {
  routeTripShapeLookup: z.record(z.string(), z.record(z.string(), z.string())),
  tripIdStopIdsLookup: z.record(z.string(), z.array(z.string())),
  shapeIdLineStringLookup: z.record(z.string(), z.array(z.tuple([z.number(), z.number()]))),
});

export type RouteLinestringLookup = z.infer<typeof RouteLinestringLookupParser>;