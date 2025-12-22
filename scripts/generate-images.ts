import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import * as dotenv from 'dotenv';
import {
  MONTH_NAMES_JP,
  getTokenIdHex,
  iterateMonthRange,
  parseYearMonthArgs,
} from './lib/nftDate';

dotenv.config();

// ベース画像のパス（ユーザーが提供した画像を配置）
const BASE_IMAGE_PATH = path.join(__dirname, '..', 'assets', 'base-goshuin.png');
const OUTPUT_DIR = path.join(__dirname, '..', 'metadata', 'images');

async function generateImage(year: number, month: number): Promise<string> {
  const tokenIdHex = getTokenIdHex(year, month);
  const monthName = MONTH_NAMES_JP[month];
  
  // 出力パス
  const outputPath = path.join(OUTPUT_DIR, `${tokenIdHex}.png`);
  
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

// メイン実行
const args = process.argv.slice(2);
const parsed = parseYearMonthArgs(args, { allowRange: true });

(async () => {
  try {
    if (!parsed) {
      console.log('Usage:');
      console.log('  npx ts-node scripts/generate-images.ts                    # Current month');
      console.log('  npx ts-node scripts/generate-images.ts 2025 1             # Single month');
      console.log('  npx ts-node scripts/generate-images.ts 2025 1 2025 12     # Range');
      return;
    }

    if (parsed.kind === 'range') {
      const tasks = Array.from(iterateMonthRange(
        parsed.startYear,
        parsed.startMonth,
        parsed.endYear,
        parsed.endMonth
      )).map(({ year, month }) => generateImage(year, month));
      await Promise.all(tasks);
      console.log('\n✅ すべての画像生成が完了しました！');
      return;
    }

    await generateImage(parsed.year, parsed.month);
  } catch (error) {
    console.error('❌ 画像生成エラー:', error);
    process.exit(1);
  }
})();
