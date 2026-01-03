const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://unpkg.com/taiwan-atlas@latest/villages-10t.json';
const dest = path.join(__dirname, 'data', 'villages.topojson');

const file = fs.createWriteStream(dest);

https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
        file.close(() => {
            console.log('Download completed');
        });
    });
}).on('error', (err) => {
    fs.unlink(dest);
    console.error('Error:', err.message);
});
