import PinataClient from '@pinata/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// Pinata SDK初期化
const pinataJwt = process.env.PINATA_JWT;
if (!pinataJwt) {
  throw new Error('PINATA_JWT環境変数が設定されていません');
}

const pinata = new PinataClient({ pinataJWTKey: pinataJwt });

// 画像のIPFS CID（既にアップロード済み）
const IMAGE_CID = 'bafybeiavzhmoescnya6oqzk2ma4ydaqtot6s6db5gymlnhtxtfe4pkwtyy';
const IMAGE_IPFS_URL = `ipfs://${IMAGE_CID}`;

async function updateAndUploadMetadata(): Promise<string> {
  const metadataDir = path.join(__dirname, '..', 'metadata');

  // メタデータファイルを読み込み、imageフィールドを更新
  const files = fs.readdirSync(metadataDir)
    .filter(file => file.endsWith('.json'))
    .sort();

  console.log(`\n📝 ${files.length}個のメタデータファイルを更新中...\n`);

  // 一時ディレクトリを作成
  const tempDir = path.join(__dirname, '..', 'temp-metadata-upload');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  // 各メタデータファイルを更新してコピー
  for (const file of files) {
    const filePath = path.join(metadataDir, file);
    const metadata = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // imageフィールドをIPFS URLに更新
    metadata.image = IMAGE_IPFS_URL;

    // external_urlも更新（オプション）
    metadata.external_url = 'https://osaisen.app';

    // 一時ディレクトリに保存
    fs.writeFileSync(
      path.join(tempDir, file),
      JSON.stringify(metadata, null, 2)
    );

    console.log(`  ✅ ${file} - image: ${IMAGE_IPFS_URL}`);
  }

  console.log('\n📤 メタデータディレクトリをIPFSにアップロード中...\n');

  // ディレクトリ全体をアップロード
  const result = await pinata.pinFromFS(tempDir, {
    pinataMetadata: {
      name: 'osaisen-metadata'
    }
  });

  // 一時ディレクトリを削除
  fs.rmSync(tempDir, { recursive: true });

  const ipfsHash = result.IpfsHash;
  const ipfsUri = `ipfs://${ipfsHash}/`;

  console.log('\n' + '='.repeat(60));
  console.log('✅ アップロード完了！');
  console.log('='.repeat(60));
  console.log(`IPFS CID: ${ipfsHash}`);
  console.log(`Base URI: ${ipfsUri}`);
  console.log(`Gateway:  https://gold-active-swan-294.mypinata.cloud/ipfs/${ipfsHash}/`);
  console.log('='.repeat(60));

  console.log('\n📝 .envファイルのNFT_BASE_URIを以下に更新してください:');
  console.log(`   NFT_BASE_URI=${ipfsUri}`);

  console.log('\n📝 コントラクトのbaseURIを設定:');
  console.log(`   npm run nft:set-uri -- --network amoy`);

  return ipfsUri;
}

// 実行
updateAndUploadMetadata()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ エラー:', error);
    process.exit(1);
  });
