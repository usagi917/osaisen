interface FriendlyError {
  title: string;
  message: string;
  action?: string;
}

const ERROR_PATTERNS: { pattern: RegExp; error: FriendlyError }[] = [
  {
    pattern: /user rejected|user denied|rejected the request|cancelled/i,
    error: {
      title: '操作がキャンセルされました',
      message: 'ウォレットでの操作が中断されました',
      action: 'もう一度お試しください',
    },
  },
  {
    pattern: /insufficient funds for gas/i,
    error: {
      title: 'ガス代が不足しています',
      message: 'トランザクション手数料に必要なMATICが足りません',
      action: 'ウォレットにMATICを入金してください',
    },
  },
  {
    pattern: /insufficient balance|exceeds balance/i,
    error: {
      title: '残高が不足しています',
      message: '奉納に必要なJPYCが足りません',
      action: 'ウォレットにJPYCを入金してください',
    },
  },
  {
    pattern: /network|timeout|failed to fetch|could not connect/i,
    error: {
      title: '通信エラー',
      message: 'ネットワークとの接続に問題が発生しました',
      action: 'インターネット接続を確認してください',
    },
  },
  {
    pattern: /revert|execution reverted/i,
    error: {
      title: '処理に失敗しました',
      message: 'トランザクションが正常に完了しませんでした',
      action: '金額や残高を確認してください',
    },
  },
  {
    pattern: /already pending|already processing/i,
    error: {
      title: '処理中です',
      message: '前回のトランザクションがまだ完了していません',
      action: 'しばらくお待ちください',
    },
  },
];

export function humanizeError(error: Error): FriendlyError {
  const message = error.message || '';

  for (const { pattern, error: friendlyError } of ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return friendlyError;
    }
  }

  return {
    title: 'エラーが発生しました',
    message: '予期しない問題が発生しました',
    action: 'ページを再読み込みしてください',
  };
}
