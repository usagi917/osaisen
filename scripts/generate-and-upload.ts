import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { uploadImageAndMetadata } from './upload-to-pinata';
import * as dotenv from 'dotenv';
import { parseYearMonthArgs } from './lib/nftDate';

dotenv.config();

const execAsync = promisify(exec);

async function generateImage(year: number, month: number): Promise<void> {
  const scriptPath = path.join(__dirname, 'generate-images.ts');
  const { stdout, stderr } = await execAsync(`npx ts-node ${scriptPath} ${year} ${month}`);
  if (stderr && !stderr.includes('warning')) {
    console.error(stderr);
  }
  if (stdout) {
    console.log(stdout);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const parsed = parseYearMonthArgs(args, { allowRange: true });
  
  try {
    if (!parsed) {
      console.log('Usage:');
      console.log('  npx ts-node scripts/generate-and-upload.ts                    # Current month');
      console.log('  npx ts-node scripts/generate-and-upload.ts 2025 1             # Single month');
      return;
    }

    if (parsed.kind === 'range') {
      console.log('Range指定はサポートしていません。単一月を指定してください。');
      return;
    }

    const { year, month } = parsed;
    console.log(`\n📸 ${year}年${month}月の画像を生成中...`);
    await generateImage(year, month);

    console.log(`\n☁️  IPFSにアップロード中...`);
    const result = await uploadImageAndMetadata(year, month);

    console.log('\n✅ 完了！');
    console.log(`画像: ${result.imageHash}`);
    console.log(`メタデータ: ${result.metadataHash}`);
  } catch (error: any) {
    console.error('\n❌ エラー:', error.message || error);
    process.exit(1);
  }
}

main();
