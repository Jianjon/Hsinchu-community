const fs = require('fs');
const topojson = require('topojson-client');

const data = JSON.parse(fs.readFileSync('./data/villages.topojson', 'utf8'));
// Keys?
console.log('Keys:', Object.keys(data.objects));
const layerName = Object.keys(data.objects)[0];
const feature = topojson.feature(data, data.objects[layerName]).features[0];
console.log('Props:', feature.properties);
