import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import shell from 'shelljs';


/**
 * Generates a vector tileset at `/tilesOutputPath` from the LDGeoJSON saved at `/inputLDGeoJsonPath`
 * 
 * @param {string} inputLDGeoJsonPath 
 * @param {string} tilesOutputPath 
 * @param {string} vectorLayerName 
 * @param {number} minZoom 
 * @param {boolean} shouldSimplifyLines 
 * @param {boolean} dontDropPoints 
 * @returns {Promise<void>} Resolves when the tileset generation is complete
 */
export async function runTippecanoe(
  inputLDGeoJsonPath,
  tilesOutputPath,
  vectorLayerName,
  minZoom,
  shouldSimplifyLines,
  dontDropPoints
) {
  return new Promise((resolve, reject) => {
    const tippeCanoePath = './gtfs-processor/submodule-deps/tippecanoe/tippecanoe';
    if (!existsSync(tippeCanoePath)) {
      reject(new Error('tippecanoe is not installed and available on PATH'));
      return;
    }

    const params = ['-e', tilesOutputPath, '-l', vectorLayerName, '-P', `-Z${minZoom}`, '-U', 3];
    if (shouldSimplifyLines) {
      params.push('-S', '15');
    }
    if (dontDropPoints) {
      params.push('-r', '0', '-g', '0');
    }
    params.push(inputLDGeoJsonPath);

    console.log(`Running tippecanoe ${params.join(' ')}`);
    try {
      const proc = spawn(tippeCanoePath, params);
      proc.stdout.on('data', (data) => {
        console.log(`${data}`);
      });
      // Tippecanoe is weird and can write out normal logs to stderr (why idk!)
      proc.stderr.on('data', (data) => {
        console.log(`${data}`);
      });
      
      proc.on('close', (code) => {
        if(code !== 0) {
          reject(new Error(`Tippecanoe failed to tile ${vectorLayerName}`));
        } else {
          resolve();
        }
      });
    } catch (e) {
      console.log(e);
      reject(e);
    }
  });
}
