import PinataClient from '@pinata/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// Pinata SDK初期化（JWT方式）
const pinataJwt = process.env.PINATA_JWT;
if (!pinataJwt) {
  throw new Error('PINATA_JWT環境変数が設定されていません。.envファイルにPINATA_JWTを設定してください。');
}

const pinata = new PinataClient({
  pinataJWTKey: pinataJwt,
});

/**
 * メタデータディレクトリ全体をIPFSにアップロード
 * ERC1155のbaseURIとして使用するため、ディレクトリ全体をアップロードします
 */
async function uploadMetadataDirectory(): Promise<string> {
  const metadataDir = path.join(__dirname, '..', 'metadata');
  
  if (!fs.existsSync(metadataDir)) {
    throw new Error(`メタデータディレクトリが見つかりません: ${metadataDir}`);
  }

  // メタデータファイルを読み込む
  const files = fs.readdirSync(metadataDir)
    .filter(file => file.endsWith('.json'))
    .map(file => {
      const filePath = path.join(metadataDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const metadata = JSON.parse(content);
      
      return {
        path: file,
        content: Buffer.from(JSON.stringify(metadata, null, 2)),
      };
    });

  if (files.length === 0) {
    throw new Error('メタデータファイルが見つかりません。先にメタデータを生成してください: npm run metadata:generate');
  }

  console.log(`\n📤 ${files.length}個のメタデータファイルをIPFSにアップロード中...\n`);

  // ディレクトリ全体をアップロード
  // Pinata SDK v2では、各ファイルを個別にアップロードしてディレクトリ構造を保持
  // または、FormDataを使用してディレクトリ全体をアップロード
  
  // 方法1: 各ファイルを個別にアップロード（推奨）
  // ただし、baseURIとして使用するには、ディレクトリ全体のハッシュが必要
  // そのため、一時ディレクトリを作成してからアップロード
  
  const tempDir = path.join(__dirname, '..', 'temp-metadata');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  // メタデータファイルを一時ディレクトリにコピー
  files.forEach(f => {
    fs.writeFileSync(path.join(tempDir, f.path), f.content);
  });

  // ディレクトリ全体をアップロード
  const result = await pinata.pinFromFS(tempDir, {
    pinataMetadata: {
      name: 'osaisen-metadata',
    },
    pinataOptions: {
      wrapWithDirectory: true,
    },
  });

  // 一時ディレクトリを削除
  fs.rmSync(tempDir, { recursive: true });

  const ipfsHash = result.IpfsHash;
  const ipfsUri = `ipfs://${ipfsHash}/`;
  const gatewayUri = `https://gateway.pinata.cloud/ipfs/${ipfsHash}/`;

  console.log('\n✅ メタデータディレクトリのアップロード完了！');
  console.log(`IPFS Hash: ${ipfsHash}`);
  console.log(`IPFS URI: ${ipfsUri}`);
  console.log(`Gateway URI: ${gatewayUri}`);
  console.log('\n📝 コントラクトのbaseURIとして設定する値:');
  console.log(`   ${ipfsUri}`);
  console.log(`   または（ブラウザ対応）: ${gatewayUri}`);

  return ipfsUri;
}

// メイン実行
(async () => {
  try {
    const baseUri = await uploadMetadataDirectory();
    
    console.log('\n💡 次のステップ:');
    console.log('   コントラクトのbaseURIを設定してください:');
    console.log(`   npm run nft:set-uri -- --network amoy "${baseUri}"`);
  } catch (error: any) {
    console.error('\n❌ エラー:', error.message || error);
    process.exit(1);
  }
})();
