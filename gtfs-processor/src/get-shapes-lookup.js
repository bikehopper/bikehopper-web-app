const { createReadStream } = require('node:fs');
const { resolve } = require("path");
const { parse } = require('csv-parse');

async function getShapesLookup(unzippedGtfsPath) {
  const shapesStream = createReadStream(resolve(unzippedGtfsPath, 'shapes.txt'), {encoding: 'utf8'});
  const parser = shapesStream.pipe(parse({columns: true}));

  const table = {};

  for await(const shapeRow of parser) {
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

module.exports = {
  getShapesLookup,
};
