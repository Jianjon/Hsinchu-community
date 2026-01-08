
const fs = require('fs');
const path = require('path');

const LOCAL_DB_ROOT = path.resolve('data/local_db');

const counts = {
    culture: 0,
    travel: 0,
    events: 0,
    projects: 0,
    care: 0,
    wiki: 0
};

function scanDir(dir) {
    const items = fs.readdirSync(dir);

    // check if this is a leaf node (village)
    if (items.some(i => i.endsWith('.json'))) {
        // Process files
        if (fs.existsSync(path.join(dir, 'culture.json'))) {
            try { counts.culture += JSON.parse(fs.readFileSync(path.join(dir, 'culture.json'), 'utf8')).length || 0; } catch (e) { }
        }
        if (fs.existsSync(path.join(dir, 'travel.json'))) {
            try { counts.travel += JSON.parse(fs.readFileSync(path.join(dir, 'travel.json'), 'utf8')).length || 0; } catch (e) { }
        }
        if (fs.existsSync(path.join(dir, 'events.json'))) {
            try { counts.events += JSON.parse(fs.readFileSync(path.join(dir, 'events.json'), 'utf8')).length || 0; } catch (e) { }
        }
        if (fs.existsSync(path.join(dir, 'projects.json'))) {
            try { counts.projects += JSON.parse(fs.readFileSync(path.join(dir, 'projects.json'), 'utf8')).length || 0; } catch (e) { }
        }
        if (fs.existsSync(path.join(dir, 'care.json'))) {
            try { counts.care += JSON.parse(fs.readFileSync(path.join(dir, 'care.json'), 'utf8')).length || 0; } catch (e) { }
        }
        if (fs.existsSync(path.join(dir, 'wiki.json'))) {
            counts.wiki += 1; // It's one village
        }
    } else {
        // Recurse
        for (const item of items) {
            if (item.startsWith('.')) continue; // ignore hidden
            const fullPath = path.join(dir, item);
            if (fs.statSync(fullPath).isDirectory()) {
                scanDir(fullPath);
            }
        }
    }
}

console.log("📊 Counting Local DB Data Items...");
if (fs.existsSync(LOCAL_DB_ROOT)) {
    scanDir(LOCAL_DB_ROOT);
}

console.log("\n--- Database Statistics ---");
console.log(`🏯 Culture (文化資產): ${counts.culture}`);
console.log(`🏞️ Travel (旅遊景點): ${counts.travel}`);
console.log(`🎉 Events (社區活動): ${counts.events}`);
console.log(`🏗️ Projects (建設案): ${counts.projects}`);
console.log(`❤️ Care (關懷服務): ${counts.care}`);
console.log(`📖 Wiki Locations (基本資料): ${counts.wiki}`);
console.log("---------------------------");
