const fs = require('fs');
const topojson = require('topojson-client');

const data = JSON.parse(fs.readFileSync('./data/villages.topojson', 'utf8'));
const geojson = topojson.feature(data, data.objects.towns);

const hsinchuFeatures = geojson.features.filter(f => f.properties.COUNTYNAME === '新竹縣');

console.log(`Found ${hsinchuFeatures.length} towns in Hsinchu County.`);

const output = {
    type: "FeatureCollection",
    features: hsinchuFeatures
};

fs.writeFileSync('./data/public_hsinchu_townships.json', JSON.stringify(output), 'utf8');
console.log('Saved data/public_hsinchu_townships.json');
