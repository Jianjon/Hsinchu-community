import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_PATH = path.join(__dirname, '../data/generated_communities.json');
const TS_PATH = path.join(__dirname, '../data/generated_communities.ts');

const data = fs.readFileSync(JSON_PATH, 'utf-8');
const tsContent = `export const GENERATED_COMMUNITIES = ${data};`;

fs.writeFileSync(TS_PATH, tsContent, 'utf-8');
console.log(`Converted JSON to TS at ${TS_PATH}`);
