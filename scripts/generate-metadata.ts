import * as fs from 'fs';
import * as path from 'path';

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

// Japanese month names
const MONTH_NAMES_JP = [
  '', '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
];

function generateMetadata(year: number, month: number): NFTMetadata {
  const tokenId = year * 100 + month;
  const monthName = MONTH_NAMES_JP[month];

  // Unix timestamp for the first day of the month (UTC)
  const periodTimestamp = Math.floor(Date.UTC(year, month - 1, 1) / 1000);

  return {
    name: `白山比咩神社 参拝記念 ${year}年${monthName}`,
    description: `白山比咩神社にて${year}年${monthName}に賽銭を奉納された方への記念NFTです。`,
    image: `${BASE_URL}/images/${tokenId}.png`,
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
  const tokenId = year * 100 + month;
  const metadata = generateMetadata(year, month);

  const outputDir = path.join(__dirname, '..', 'metadata');
  const outputPath = path.join(outputDir, `${tokenId}.json`);

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
  console.log(`Generated: ${outputPath}`);
}

function generateMonthRange(startYear: number, startMonth: number, endYear: number, endMonth: number): void {
  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    saveMetadata(year, month);

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  // Default: generate for current month
  const now = new Date();
  saveMetadata(now.getFullYear(), now.getMonth() + 1);
} else if (args.length === 2) {
  // Generate single month: year month
  const year = parseInt(args[0]);
  const month = parseInt(args[1]);
  saveMetadata(year, month);
} else if (args.length === 4) {
  // Generate range: startYear startMonth endYear endMonth
  const [startYear, startMonth, endYear, endMonth] = args.map(Number);
  generateMonthRange(startYear, startMonth, endYear, endMonth);
} else {
  console.log('Usage:');
  console.log('  npx ts-node scripts/generate-metadata.ts                    # Current month');
  console.log('  npx ts-node scripts/generate-metadata.ts 2025 1             # Single month');
  console.log('  npx ts-node scripts/generate-metadata.ts 2025 1 2025 12     # Range');
}
