import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultOutputPath = path.resolve(__dirname, '../config/shared-config.json');

const [, , inputPathArg, outputPathArg] = process.argv;

if (!inputPathArg) {
    console.error('Usage: node scripts/generate-shared-config.mjs <input-json> [output-json]');
    process.exit(1);
}

const inputPath = path.resolve(process.cwd(), inputPathArg);
const outputPath = outputPathArg
    ? path.resolve(process.cwd(), outputPathArg)
    : defaultOutputPath;

const raw = fs.readFileSync(inputPath, 'utf8');
const config = JSON.parse(raw);

if (config.name !== 'LibreTV-Settings' || !config.data) {
    console.error('Invalid LibreTV export JSON.');
    process.exit(1);
}

const sharedConfig = {
    name: 'LibreTV-Shared-Config',
    version: 1,
    selectedAPIs: JSON.parse(config.data.selectedAPIs || '[]'),
    customAPIs: JSON.parse(config.data.customAPIs || '[]'),
    settings: {
        yellowFilterEnabled: (config.data.yellowFilterEnabled ?? 'true') === 'true',
        adFilteringEnabled: (config.data.adFilteringEnabled ?? 'true') === 'true',
        doubanEnabled: (config.data.doubanEnabled ?? 'true') === 'true',
        hasInitializedDefaults: (config.data.hasInitializedDefaults ?? 'true') === 'true'
    }
};
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(sharedConfig, null, 2)}\n`, 'utf8');
console.log(`Shared config JSON generated: ${outputPath}`);
