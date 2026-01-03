import fs from 'fs';
import * as topojson from 'topojson-client';

const topoData = JSON.parse(fs.readFileSync('data/villages.topojson', 'utf8'));

// 1. Extract Villages for Hsinchu City
const villagesGeo = topojson.feature(topoData, topoData.objects.villages);
const hsinchuCityVillages = {
    type: "FeatureCollection",
    features: villagesGeo.features.filter(f => f.properties.COUNTYNAME === "新竹市")
};

fs.writeFileSync('data/public_hsinchu_city_villages.json', JSON.stringify(hsinchuCityVillages));
console.log(`Extracted ${hsinchuCityVillages.features.length} villages for Hsinchu City.`);

// 2. Extract Townships for Hsinchu City
const townsGeo = topojson.feature(topoData, topoData.objects.towns);
const hsinchuCityTownships = {
    type: "FeatureCollection",
    features: townsGeo.features.filter(f => f.properties.COUNTYNAME === "新竹市")
};

fs.writeFileSync('data/public_hsinchu_city_townships.json', JSON.stringify(hsinchuCityTownships));
console.log(`Extracted ${hsinchuCityTownships.features.length} townships for Hsinchu City.`);
