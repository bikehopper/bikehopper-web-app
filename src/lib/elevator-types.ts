import * as z from 'zod';

export const ElevatorInfoParser = z.object({
  agency: z.string(),
  station: z.string(),
  elevator_stops: z.string(),
  door: z.string(),
  width: z.string(),
  length: z.string(),
  diagonal: z.string(),
});

export const ElevatorsJsonParser = z.record(z.string(), z.array(ElevatorInfoParser));

export type ElevatorInfo = z.infer<typeof ElevatorInfoParser>;
export type ElevatorsJson = z.infer<typeof ElevatorsJsonParser>;