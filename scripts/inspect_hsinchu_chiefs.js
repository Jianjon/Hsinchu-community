
const URL = "https://ws.hsinchu.gov.tw/001/Upload/1/opendata/8774/2109/0a3a0392-96d4-4b1e-97eb-444cd54320bd.json";

async function main() {
    try {
        console.log(`Fetching ${URL}...`);
        const res = await fetch(URL);
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();

        console.log(`Fetched ${data.length} records.`);
        if (data.length > 0) {
            console.log("Sample record:", JSON.stringify(data[0], null, 2));

            // Check for useful fields
            const headers = Object.keys(data[0]);
            console.log("Fields detected:", headers.join(", "));
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
