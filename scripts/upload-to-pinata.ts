import { PinataSDK } from '@pinata/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

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
  const tokenId = year * 100 + month;
  
  // 画像をアップロード
  const imagePath = path.join(__dirname, '..', 'metadata', 'images', `${tokenId}.png`);
  if (!fs.existsSync(imagePath)) {
    throw new Error(`画像が見つかりません: ${imagePath}\n先に画像を生成してください: npm run images:generate ${year} ${month}`);
  }
  
  const imageHash = await uploadFile(imagePath, `${tokenId}.png`);
  
  // メタデータを読み込み、画像URLを更新
  const metadataPath = path.join(__dirname, '..', 'metadata', `${tokenId}.json`);
  if (!fs.existsSync(metadataPath)) {
    throw new Error(`メタデータが見つかりません: ${metadataPath}\n先にメタデータを生成してください: npm run metadata:generate ${year} ${month}`);
  }
  
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  metadata.image = imageHash; // IPFS URLに更新
  
  // メタデータをアップロード
  const metadataHash = await uploadMetadata(metadata, `${tokenId}.json`);
  
  return {
    imageHash,
    metadataHash,
  };
}

// メイン実行
const args = process.argv.slice(2);

(async () => {
  try {
    if (args.length === 0) {
      // デフォルト: 現在の月
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      console.log(`\n📤 ${year}年${month}月のNFTをIPFSにアップロード中...\n`);
      const result = await uploadImageAndMetadata(year, month);
      
      console.log('\n✅ アップロード完了！');
      console.log(`画像: ${result.imageHash}`);
      console.log(`メタデータ: ${result.metadataHash}`);
    } else if (args.length === 2) {
      // 単一月: year month
      const year = parseInt(args[0]);
      const month = parseInt(args[1]);
      
      console.log(`\n📤 ${year}年${month}月のNFTをIPFSにアップロード中...\n`);
      const result = await uploadImageAndMetadata(year, month);
      
      console.log('\n✅ アップロード完了！');
      console.log(`画像: ${result.imageHash}`);
      console.log(`メタデータ: ${result.metadataHash}`);
    } else if (args.length === 4) {
      // 範囲: startYear startMonth endYear endMonth
      const [startYear, startMonth, endYear, endMonth] = args.map(Number);
      let year = startYear;
      let month = startMonth;
      
      console.log(`\n📤 ${startYear}年${startMonth}月〜${endYear}年${endMonth}月のNFTをIPFSにアップロード中...\n`);
      
      while (year < endYear || (year === endYear && month <= endMonth)) {
        console.log(`\n📅 ${year}年${month}月:`);
        const result = await uploadImageAndMetadata(year, month);
        console.log(`  ✅ 完了 - 画像: ${result.imageHash}`);
        console.log(`  ✅ 完了 - メタデータ: ${result.metadataHash}`);
        
        month++;
        if (month > 12) {
          month = 1;
          year++;
        }
      }
      
      console.log('\n✅ すべてのアップロードが完了しました！');
    } else {
      console.log('Usage:');
      console.log('  npx ts-node scripts/upload-to-pinata.ts                    # Current month');
      console.log('  npx ts-node scripts/upload-to-pinata.ts 2025 1             # Single month');
      console.log('  npx ts-node scripts/upload-to-pinata.ts 2025 1 2025 12     # Range');
    }
  } catch (error: any) {
    console.error('\n❌ Pinataアップロードエラー:', error.message || error);
    process.exit(1);
  }
})();

