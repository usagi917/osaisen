import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import * as dotenv from 'dotenv';

dotenv.config();

// ベース画像のパス（ユーザーが提供した画像を配置）
const BASE_IMAGE_PATH = path.join(__dirname, '..', 'assets', 'base-goshuin.png');
const OUTPUT_DIR = path.join(__dirname, '..', 'metadata', 'images');

// 日本語の月名
const MONTH_NAMES_JP = [
  '', '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
];

async function generateImage(year: number, month: number): Promise<string> {
  const tokenId = year * 100 + month;
  const monthName = MONTH_NAMES_JP[month];
  
  // 出力パス
  const outputPath = path.join(OUTPUT_DIR, `${tokenId}.png`);
  
  // 出力ディレクトリが存在しない場合は作成
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // ベース画像が存在するか確認
  if (!fs.existsSync(BASE_IMAGE_PATH)) {
    throw new Error(`ベース画像が見つかりません: ${BASE_IMAGE_PATH}`);
  }
  
  // ベース画像を読み込み
  const baseImage = sharp(BASE_IMAGE_PATH);
  const metadata = await baseImage.metadata();
  const width = metadata.width || 1200;
  const height = metadata.height || 1600;
  
  // SVGテキスト（月情報を刻む）
  const svgText = `
    <svg width="${width}" height="${height}">
      <text 
        x="${width / 2}" 
        y="${height - 100}" 
        font-family="serif" 
        font-size="48" 
        fill="#000000" 
        text-anchor="middle"
        font-weight="bold"
      >
        ${year}年${monthName}
      </text>
    </svg>
  `;
  
  // ベース画像にテキストをオーバーレイ
  await baseImage
    .composite([
      {
        input: Buffer.from(svgText),
        top: 0,
        left: 0,
      }
    ])
    .png()
    .toFile(outputPath);
  
  console.log(`✅ 画像生成完了: ${outputPath}`);
  return outputPath;
}

function generateMonthRange(
  startYear: number, 
  startMonth: number, 
  endYear: number, 
  endMonth: number
): Promise<string[]> {
  const promises: Promise<string>[] = [];
  let year = startYear;
  let month = startMonth;
  
  while (year < endYear || (year === endYear && month <= endMonth)) {
    promises.push(generateImage(year, month));
    
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  
  return Promise.all(promises);
}

// メイン実行
const args = process.argv.slice(2);

(async () => {
  try {
    if (args.length === 0) {
      // デフォルト: 現在の月
      const now = new Date();
      await generateImage(now.getFullYear(), now.getMonth() + 1);
    } else if (args.length === 2) {
      // 単一月: year month
      const year = parseInt(args[0]);
      const month = parseInt(args[1]);
      await generateImage(year, month);
    } else if (args.length === 4) {
      // 範囲: startYear startMonth endYear endMonth
      const [startYear, startMonth, endYear, endMonth] = args.map(Number);
      await generateMonthRange(startYear, startMonth, endYear, endMonth);
      console.log('\n✅ すべての画像生成が完了しました！');
    } else {
      console.log('Usage:');
      console.log('  npx ts-node scripts/generate-images.ts                    # Current month');
      console.log('  npx ts-node scripts/generate-images.ts 2025 1             # Single month');
      console.log('  npx ts-node scripts/generate-images.ts 2025 1 2025 12     # Range');
    }
  } catch (error) {
    console.error('❌ 画像生成エラー:', error);
    process.exit(1);
  }
})();

