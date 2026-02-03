# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Osaisen（デジタルお賽銭箱）は、Polygonネットワーク上でJPYCを使用したデジタルお賽銭システムのdAppです。ユーザーは115 JPYC以上を奉納し、毎月最初の奉納時に記念NFT（ERC1155）を受け取ります。

## 開発コマンド

### スマートコントラクト（ルートディレクトリ）
```bash
pnpm compile          # コントラクトのコンパイル
pnpm test             # Hardhatテスト実行
pnpm typecheck        # TypeScript型チェック
pnpm node             # ローカルHardhatノード起動
pnpm dev:setup        # ローカルセットアップ（Mockトークンデプロイ等）
pnpm deploy:amoy      # Amoyテストネットへデプロイ
pnpm deploy:mainnet   # Polygonメインネットへデプロイ
```

### フロントエンド（frontend/ディレクトリ）
```bash
pnpm dev              # 開発サーバー起動（http://localhost:5173）
pnpm build            # プロダクションビルド
pnpm lint             # ESLint実行
pnpm test:e2e         # Playwright E2Eテスト実行
pnpm test:e2e:headed  # ブラウザ表示付きE2Eテスト
```

## アーキテクチャ

### モノレポ構成
- `/contracts` - Solidityスマートコントラクト
- `/frontend` - React + Vite Webアプリケーション
- `/scripts` - デプロイ・ユーティリティスクリプト
- `/metadata` - 月別NFTメタデータ（YYYYMM形式）
- `/test` - コントラクトテスト

### スマートコントラクト
- **SaisenRouter.sol** - お賽銭ロジックを処理するメインコントラクト。最低奉納額（115 JPYC）を強制し、月初回奉納時にNFTを自動ミント。ReentrancyGuard使用。
- **OfferingsNFT1155.sol** - 月別記念NFT用ERC1155コントラクト。TokenIdはYYYYMM形式（例: 202601）。AccessControlでMINTER_ROLE管理。

### フロントエンドパターン
- **カスタムHooks** - `/frontend/src/hooks/`にブロックチェーン操作をカプセル化（useGaslessSaisen, useSaisen, useJpycApproval等）
- **Wagmi統合** - Ethereumウォレット操作の標準化
- **ページルーティング** - ハッシュベース（#saisen, #mypage）
- **TanStack Query** - サーバー状態管理

### 対応ネットワーク
- Polygon Mainnet
- Polygon Amoy（テストネット）
- Hardhat localhost（ローカル開発）

## 技術スタック

**コントラクト**: Solidity 0.8.20, Hardhat, OpenZeppelin, Ethers.js v6
**フロントエンド**: React 19, Vite, TypeScript, Tailwind CSS, Wagmi, Viem, Framer Motion
**テスト**: Hardhat + Chai（コントラクト）、Playwright（E2E）
