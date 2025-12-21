import { ethers, network } from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * NFTコントラクトのbaseURIを設定するスクリプト
 * 
 * Usage:
 *   npx hardhat run scripts/set-nft-baseuri.ts --network amoy -- --uri "ipfs://QmXXX/"
 *   または
 *   npx hardhat run scripts/set-nft-baseuri.ts --network amoy
 *   (この場合、環境変数NFT_BASE_URIを使用)
 */
async function main() {
  const args = process.argv.slice(process.argv.indexOf('--') + 1);
  const uriArg = args.find(arg => arg.startsWith('--uri='));
  const baseUri = uriArg 
    ? uriArg.split('=')[1] 
    : process.env.NFT_BASE_URI;

  if (!baseUri) {
    throw new Error(
      'baseURIが指定されていません。\n' +
      '使用方法:\n' +
      '  1. 環境変数NFT_BASE_URIを設定\n' +
      '  2. または --uri="ipfs://QmXXX/" を指定\n' +
      '例: npx hardhat run scripts/set-nft-baseuri.ts --network amoy -- --uri="ipfs://QmXXX/"'
    );
  }

  // baseURIの形式チェック
  // {id} を含む場合（ERC1155標準形式）はそのまま使用
  // それ以外はディレクトリ形式として末尾にスラッシュを追加
  let normalizedUri = baseUri;
  if (baseUri.includes('{id}')) {
    console.log('ℹ️  ERC1155標準形式 ({id} プレースホルダー) を使用します。');
  } else if (!baseUri.endsWith('/')) {
    console.warn('⚠️  baseURIは末尾にスラッシュ(/)が必要です。自動的に追加します。');
    normalizedUri = `${baseUri}/`;
  }

  const nftAddress = process.env.NFT_ADDRESS_AMOY || process.env.NFT_ADDRESS_MAINNET;
  if (!nftAddress) {
    throw new Error(
      'NFTコントラクトアドレスが設定されていません。\n' +
      '.envファイルにNFT_ADDRESS_AMOYまたはNFT_ADDRESS_MAINNETを設定してください。'
    );
  }

  const [deployer] = await ethers.getSigners();

  console.log('='.repeat(60));
  console.log('NFT BaseURI設定');
  console.log('='.repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`NFT Address: ${nftAddress}`);
  console.log(`New BaseURI: ${normalizedUri}`);
  console.log('='.repeat(60));

  // NFTコントラクトに接続
  const NFTFactory = await ethers.getContractFactory('OfferingsNFT1155');
  const nft = NFTFactory.attach(nftAddress);

  // 現在のbaseURIを確認
  try {
    const currentUri = await nft.uri(0); // tokenId=0でbaseURIを取得
    console.log(`\n現在のBaseURI: ${currentUri}`);
  } catch (error) {
    console.log('\n現在のBaseURI: 取得できませんでした（初回設定の可能性があります）');
  }

  // baseURIを設定
  console.log(`\n📝 baseURIを設定中...`);
  const tx = await nft.setURI(normalizedUri);
  console.log(`Transaction Hash: ${tx.hash}`);
  
  console.log('⏳ トランザクションの確認を待機中...');
  const receipt = await tx.wait();
  
  console.log('\n✅ baseURIの設定が完了しました！');
  console.log(`Block Number: ${receipt?.blockNumber}`);
  
  // 設定後のbaseURIを確認
  const newUri = await nft.uri(0);
  console.log(`\n新しいBaseURI: ${newUri}`);
  
  // テスト: 実際のtokenIdでURIを確認
  const testTokenId = 202501; // 2025年1月
  const testUri = await nft.uri(testTokenId);
  console.log(`\nテスト (tokenId=${testTokenId}): ${testUri}`);
  console.log('\n💡 このURIが正しくメタデータを指しているか確認してください。');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

