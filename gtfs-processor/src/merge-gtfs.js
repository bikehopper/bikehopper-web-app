const { join, basename } = require('node:path');
const { readdir } = require('node:fs/promises');
const skipRecrodsWithError = process.env.SKIP_RECORDS_WITH_ERROR === 'true' || false;

(async () => {
  const { importGtfs, exportGtfs } = await import('gtfs');

  const gtfsDirPath = '/usr/app/mnts/gtfs-zips';
  const configBase = {
    agencies: [],
    "csvOptions": {
      "skip_records_with_error": skipRecrodsWithError
    },
    "exportPath": "/usr/app/mnts/output/merged-gtfs"
  };
  const zipRegex = /.*\.zip$/;

  const files = await readdir(gtfsDirPath);

  const config = files
    .filter(f => zipRegex.test(f))
    .reduce((configTemplate, file) => {
      configTemplate.agencies.push({
        "path": join(gtfsDirPath, file),
        "prefix": basename(file, '.zip')
      });
      return configTemplate;
    }, configBase);

  await importGtfs(config);
  await exportGtfs(config);
})();
