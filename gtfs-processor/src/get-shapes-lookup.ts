import { getShapes } from 'gtfs';
import type { RouteLinestringLookup } from '../../src/lib/types.js';

type TempShapePoint = {pt: [number, number], ptIndex: number};

export default async function getShapesLookup(): Promise<RouteLinestringLookup['shapeIdLineStringLookup']> {
  const tempTable: Map<string, TempShapePoint[]> = new Map();

  const shapeRows = getShapes(
    {},
    ['shape_id', 'shape_pt_lon', 'shape_pt_lat', 'shape_pt_sequence'],
  );
  
  for (const shapeRow of shapeRows) {
    const shapeId = shapeRow['shape_id'];

    // TODO TS: check number types
    const lng = shapeRow['shape_pt_lon'];
    const lat = shapeRow['shape_pt_lat'];
    const ptIndex = shapeRow['shape_pt_sequence'];
    
    if (shapeId && !isNaN(lng) && !isNaN(lat) && !isNaN(ptIndex)) {
      // Lazily init the first level of the dictionary
      const arr = tempTable.get(shapeId);
      const tempPoint: TempShapePoint = { pt: [lng, lat], ptIndex};
      if (arr) {
        arr.push(tempPoint);
      } else {
        tempTable.set(shapeId, [tempPoint]);
      }
    }
  }
  
  const table: RouteLinestringLookup['shapeIdLineStringLookup'] = {};
  for(const [shapeId, unorderedPts] of tempTable.entries()) {

    const orderedPoints = unorderedPts.sort((a, b) => a.ptIndex - b.ptIndex).map((point) => point.pt);
    table[shapeId] = orderedPoints;
  }

  return table;
}
