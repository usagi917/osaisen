import { PinataSDK } from '@pinata/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import {
  getTokenIdHex,
  iterateMonthRange,
  parseYearMonthArgs,
} from './lib/nftDate';

dotenv.config();

// Pinata SDK初期化（JWT方式）
const pinataJwt = process.env.PINATA_JWT;
if (!pinataJwt) {
  throw new Error('PINATA_JWT環境変数が設定されていません。.envファイルにPINATA_JWTを設定してください。');
}

const pinata = new PinataSDK({
  pinataJwt: pinataJwt,
  pinataGateway: 'gateway.pinata.cloud',
});

interface UploadResult {
  imageHash: string;
  metadataHash: string;
}

async function uploadFile(filePath: string, name: string): Promise<string> {
  const file = fs.readFileSync(filePath);
  
  const result = await pinata.upload.file(file, {
    name: name,
  });
  
  const ipfsHash = `ipfs://${result.IpfsHash}`;
  console.log(`  📤 画像アップロード完了: ${name} -> ${ipfsHash}`);
  return ipfsHash;
}

async function uploadMetadata(metadata: any, name: string): Promise<string> {
  const result = await pinata.upload.json(metadata, {
    name: name,
  });
  
  const ipfsHash = `ipfs://${result.IpfsHash}`;
  console.log(`  📤 メタデータアップロード完了: ${name} -> ${ipfsHash}`);
  return ipfsHash;
}

export async function uploadImageAndMetadata(
  year: number,
  month: number
): Promise<UploadResult> {
  const tokenIdHex = getTokenIdHex(year, month);
  
  // 画像をアップロード
  const imagePath = path.join(__dirname, '..', 'metadata', 'images', `${tokenIdHex}.png`);
  if (!fs.existsSync(imagePath)) {
    throw new Error(`画像が見つかりません: ${imagePath}\n先に画像を生成してください: npm run images:generate ${year} ${month}`);
  }
  
  const imageHash = await uploadFile(imagePath, `${tokenIdHex}.png`);
  
  // メタデータを読み込み、画像URLを更新
  const metadataPath = path.join(__dirname, '..', 'metadata', `${tokenIdHex}.json`);
  if (!fs.existsSync(metadataPath)) {
    throw new Error(`メタデータが見つかりません: ${metadataPath}\n先にメタデータを生成してください: npm run metadata:generate ${year} ${month}`);
  }
  
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  metadata.image = imageHash; // IPFS URLに更新
  
  // メタデータをアップロード
  const metadataHash = await uploadMetadata(metadata, `${tokenIdHex}.json`);
  
  return {
    imageHash,
    metadataHash,
  };
}

// メイン実行
const args = process.argv.slice(2);
const parsed = parseYearMonthArgs(args, { allowRange: true });

(async () => {
  try {
    if (!parsed) {
      console.log('Usage:');
      console.log('  npx ts-node scripts/upload-to-pinata.ts                    # Current month');
      console.log('  npx ts-node scripts/upload-to-pinata.ts 2025 1             # Single month');
      console.log('  npx ts-node scripts/upload-to-pinata.ts 2025 1 2025 12     # Range');
      return;
    }

    if (parsed.kind === 'range') {
      console.log(`\n📤 ${parsed.startYear}年${parsed.startMonth}月〜${parsed.endYear}年${parsed.endMonth}月のNFTをIPFSにアップロード中...\n`);
      for (const { year, month } of iterateMonthRange(
        parsed.startYear,
        parsed.startMonth,
        parsed.endYear,
        parsed.endMonth
      )) {
        console.log(`\n📅 ${year}年${month}月:`);
        const result = await uploadImageAndMetadata(year, month);
        console.log(`  ✅ 完了 - 画像: ${result.imageHash}`);
        console.log(`  ✅ 完了 - メタデータ: ${result.metadataHash}`);
      }
      console.log('\n✅ すべてのアップロードが完了しました！');
      return;
    }

    console.log(`\n📤 ${parsed.year}年${parsed.month}月のNFTをIPFSにアップロード中...\n`);
    const result = await uploadImageAndMetadata(parsed.year, parsed.month);

    console.log('\n✅ アップロード完了！');
    console.log(`画像: ${result.imageHash}`);
    console.log(`メタデータ: ${result.metadataHash}`);
  } catch (error: any) {
    console.error('\n❌ Pinataアップロードエラー:', error.message || error);
    process.exit(1);
  }
})();
