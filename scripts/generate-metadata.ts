import * as fs from 'fs';
import * as path from 'path';
import {
  MONTH_NAMES_JP,
  getTokenIdHex,
  iterateMonthRange,
  parseYearMonthArgs,
} from './lib/nftDate';

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
}

// Configuration - update these for production
const BASE_URL = process.env.METADATA_BASE_URL || 'https://osaisen.example.com/metadata';

function generateMetadata(year: number, month: number): NFTMetadata {
  const tokenIdHex = getTokenIdHex(year, month);
  const monthName = MONTH_NAMES_JP[month];

  // Unix timestamp for the first day of the month (UTC)
  const periodTimestamp = Math.floor(Date.UTC(year, month - 1, 1) / 1000);

  return {
    name: `白山比咩神社 参拝記念 ${year}年${monthName}`,
    description: `白山比咩神社にて${year}年${monthName}に賽銭を奉納された方への記念NFTです。`,
    image: `${BASE_URL}/images/${tokenIdHex}.png`,
    external_url: 'https://osaisen.example.com',
    attributes: [
      {
        trait_type: 'Year',
        value: year
      },
      {
        trait_type: 'Month',
        value: month
      },
      {
        display_type: 'date',
        trait_type: 'Period',
        value: periodTimestamp
      },
      {
        trait_type: 'Shrine',
        value: 'Shirayama Hime Shrine'
      },
      {
        trait_type: 'Type',
        value: 'Monthly Offering Token'
      }
    ]
  };
}

function saveMetadata(year: number, month: number): void {
  const tokenIdHex = getTokenIdHex(year, month);
  const metadata = generateMetadata(year, month);

  const outputDir = path.join(__dirname, '..', 'metadata');
  const outputPath = path.join(outputDir, `${tokenIdHex}.json`);

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
  console.log(`Generated: ${outputPath}`);
}

// Main execution
const args = process.argv.slice(2);
const parsed = parseYearMonthArgs(args, { allowRange: true });

if (!parsed) {
  console.log('Usage:');
  console.log('  npx ts-node scripts/generate-metadata.ts                    # Current month');
  console.log('  npx ts-node scripts/generate-metadata.ts 2025 1             # Single month');
  console.log('  npx ts-node scripts/generate-metadata.ts 2025 1 2025 12     # Range');
} else if (parsed.kind === 'range') {
  for (const { year, month } of iterateMonthRange(
    parsed.startYear,
    parsed.startMonth,
    parsed.endYear,
    parsed.endMonth
  )) {
    saveMetadata(year, month);
  }
} else {
  saveMetadata(parsed.year, parsed.month);
}
