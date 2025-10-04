import { getShapes } from 'gtfs';

export default async function getShapesLookup() {
  const table = {};

  const shapeRows = getShapes(
    {},
    ['shape_id', 'shape_pt_lon', 'shape_pt_lat', 'shape_pt_sequence'],
  );

  for (const shapeRow of shapeRows) {
    const shapeId = shapeRow['shape_id'];
    const lng = parseFloat(shapeRow['shape_pt_lon']);
    const lat = parseFloat(shapeRow['shape_pt_lat']);
    const ptIndex = parseInt(shapeRow['shape_pt_sequence']);

    if (shapeId && !isNaN(lng) && !isNaN(lat) && !isNaN(ptIndex)) {
      // Lazily init the first level of the dictionary
      if (table[shapeId] == null) {
        table[shapeId] = [];
      }

      table[shapeId].push({ pt: [lng, lat], ptIndex});
    }
  }

  for(const shapeId in table) {
    const unorderedPts = table[shapeId];
    const orderedPoints = unorderedPts.sort((a, b) => a.ptIndex - b.ptIndex).map((point) => point.pt);
    table[shapeId] = orderedPoints;
  }

  return table;
}
