const fs = require('fs');
const topojson = require('topojson-client');

const data = JSON.parse(fs.readFileSync('./data/villages.topojson', 'utf8'));
const townFeatures = topojson.feature(data, data.objects.towns).features;

console.log('Total Towns:', townFeatures.length);
// Find a sample town to check properties, preferably one in Hsinchu if possible, or just the first one
const sample = townFeatures.find(f => f.properties.COUNTYNAME === '新竹縣') || townFeatures[0];
console.log('Sample Town Props:', sample.properties);

// Count Hsinchu towns
const hsinchuTowns = townFeatures.filter(f => f.properties.COUNTYNAME === '新竹縣');
console.log('Hsinchu Towns Count:', hsinchuTowns.length);
