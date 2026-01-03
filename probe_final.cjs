const https = require('https');

const urls = [
    'https://raw.githubusercontent.com/dkaoster/taiwan-atlas/main/villages-10t.json', // Try main
    'https://raw.githubusercontent.com/g0v/twgeojson/master/json/twtown2010.json',
    'https://raw.githubusercontent.com/g0v/twgeojson/master/json/twvillage2010.json',
    'https://raw.githubusercontent.com/ronnywang/twgeojson/master/json/twtown2010.json',
    'https://raw.githubusercontent.com/donma/TaiwanAddressTW/master/data/village.json'
];

urls.forEach(url => {
    https.get(url, (res) => {
        console.log(`${url}: ${res.statusCode}`);
    }).on('error', (e) => {
        console.error(`${url}: Error ${e.message}`);
    });
});
