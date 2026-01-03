const https = require('https');

const base = 'https://raw.githubusercontent.com/jason2506/Taiwan.TopoJSON/master/topojson/villages/';
const candidates = [
    '1000401.json',
    '10004010.json',
    '1000402.json',
    '10004020.json',
    '10004.json',
];

candidates.forEach(file => {
    const url = base + file;
    https.get(url, (res) => {
        console.log(`${file}: ${res.statusCode}`);
    }).on('error', (e) => {
        console.error(`${file}: Error ${e.message}`);
    });
});
