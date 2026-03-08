import * as z from 'zod';

export const RegionConfigParser = z.object({
  agencyAliases: z.record(z.string(), z.string()),
  transitDataAcknowledgement: z.object({
    text: z.string(),
    url: z.httpUrl(),
  }),
  supportedRegionDescription: z.string(),
  defaultViewport: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  gtfsRtUrls: z.object({
      alerts: z.httpUrl(),
      vehiclePositions: z.httpUrl(),
      tripUpdates: z.httpUrl(),
  }),
  timezone: z.httpUrl(),
});

export type RegionConfig = z.infer<typeof RegionConfigParser>;

export const TransitServiceAreaParser = z.object({
  type: z.literal('Feature'),
  properties: z.record(z.string(), z.string()),
  geometry: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.tuple([z.number(), z.number()])),
  }),
});

export type TransitServiceArea = z.infer<typeof TransitServiceAreaParser>;

export type FullRegionConfig = RegionConfig & { 
  transitServiceArea?: TransitServiceArea,
  mapboxAccessToken?: string,
  mapboxStyleUrl?: string,
};
