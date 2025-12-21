import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { uploadImageAndMetadata } from './upload-to-pinata';
import * as dotenv from 'dotenv';

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
  
  try {
    if (args.length === 0) {
      // デフォルト: 現在の月
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      console.log(`\n📸 ${year}年${month}月の画像を生成中...`);
      await generateImage(year, month);
      
      console.log(`\n☁️  IPFSにアップロード中...`);
      const result = await uploadImageAndMetadata(year, month);
      
      console.log('\n✅ 完了！');
      console.log(`画像: ${result.imageHash}`);
      console.log(`メタデータ: ${result.metadataHash}`);
    } else if (args.length === 2) {
      const year = parseInt(args[0]);
      const month = parseInt(args[1]);
      
      console.log(`\n📸 ${year}年${month}月の画像を生成中...`);
      await generateImage(year, month);
      
      console.log(`\n☁️  IPFSにアップロード中...`);
      const result = await uploadImageAndMetadata(year, month);
      
      console.log('\n✅ 完了！');
      console.log(`画像: ${result.imageHash}`);
      console.log(`メタデータ: ${result.metadataHash}`);
    } else {
      console.log('Usage:');
      console.log('  npx ts-node scripts/generate-and-upload.ts                    # Current month');
      console.log('  npx ts-node scripts/generate-and-upload.ts 2025 1             # Single month');
    }
  } catch (error: any) {
    console.error('\n❌ エラー:', error.message || error);
    process.exit(1);
  }
}

main();


