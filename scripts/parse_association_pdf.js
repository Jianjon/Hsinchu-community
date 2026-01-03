
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PDF_FILE = path.join(__dirname, '../data/新竹縣社區發展協會.pdf');
const OUTPUT_FILE = path.join(__dirname, '../data/hsinchu_county_associations.json');

async function main() {
    try {
        console.log(`Reading PDF: ${PDF_FILE}`);
        const dataBuffer = fs.readFileSync(PDF_FILE);

        const data = await pdf(dataBuffer);
        const text = data.text;

        const cleanText = text.replace(/（/g, '(').replace(/）/g, ')');

        console.log("--- PDF Text Dump (First 2000 chars) ---");
        console.log(cleanText.substring(0, 2000));
        console.log("--- End Dump ---");

        const associations = [];

        // Regex Strategy v2
        // Name pattern: Text ending in "社區發展協會"
        // Address pattern: "新竹縣...號"

        // Find all indices of "社區發展協會"
        const keyword = "社區發展協會";
        let cursor = 0;

        while (true) {
            const idx = cleanText.indexOf(keyword, cursor);
            if (idx === -1) break;

            // 1. Extract Name
            // Look backwards from idx to find the start of the name
            // Use a heuristic: Stop at newline or digit or whitespace
            let start = idx;
            while (start > 0) {
                const char = cleanText[start - 1];
                if (char === '\n' || char === ' ' || /\d/.test(char)) {
                    break;
                }
                start--;
            }

            const rawName = cleanText.substring(start, idx + keyword.length);
            const name = rawName.trim(); // "竹北市斗崙社區發展協會"

            // 2. Extract Address
            // Look forward from idx for "新竹縣" ... "號"
            // Search window: next 200 chars
            const searchWindow = cleanText.substring(idx + keyword.length, idx + keyword.length + 300);

            // Address Regex: Must start with 新竹縣 (as seen in dump) and end with 號
            // Allow digits (for road/house numbers) but handle merged date carefully
            // The content might be "Address...號Date..."
            // So lazy match is key.
            const addrMatch = searchWindow.match(/(新竹縣.+?號)/);

            if (addrMatch) {
                // Check if name is valid (at least 2 chars prefix)
                if (name.length > keyword.length + 1) {
                    // Prepend "新竹縣" to name if missing, for consistency
                    const fullName = name.startsWith("新竹縣") ? name : "新竹縣" + name;

                    associations.push({
                        name: fullName,
                        address: addrMatch[1].trim()
                    });
                }
            }

            cursor = idx + keyword.length;
        }

        console.log(`Parsed ${associations.length} communities with addresses.`);

        if (associations.length > 0) {
            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(associations, null, 2));
            console.log(`Sample: ${JSON.stringify(associations[0], null, 2)}`);
        } else {
            console.log("Still no data found. Check regex.");
        }

    } catch (e) {
        console.error("Error parsing PDF:", e);
    }
}

main();
