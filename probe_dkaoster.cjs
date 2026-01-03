const https = require('https');

const urls = [
    'https://raw.githubusercontent.com/dkaoster/taiwan-atlas/master/villages-10t.json',
    'https://raw.githubusercontent.com/dkaoster/taiwan-atlas/master/counties-10t.json',
    'https://raw.githubusercontent.com/dkaoster/taiwan-atlas/master/towns-10t.json'
];

urls.forEach(url => {
    https.get(url, (res) => {
        console.log(`${url}: ${res.statusCode}`);
    }).on('error', (e) => {
        console.error(`${url}: Error ${e.message}`);
    });
});
