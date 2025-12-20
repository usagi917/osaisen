/**
 * Paymaster Balance Monitoring Script
 *
 * Monitors the gas deposit balance of the Pimlico Paymaster and sends alerts
 * when the balance falls below thresholds.
 *
 * Usage:
 *   npx ts-node scripts/monitor-paymaster.ts [--network amoy|polygon] [--once]
 *
 * Environment variables:
 *   PIMLICO_API_KEY - Pimlico API key
 *   ALERT_WEBHOOK_URL - Optional: Webhook URL for alerts (Slack/Discord)
 *   PAYMASTER_THRESHOLD_LOW - Low balance threshold in USD (default: 10)
 *   PAYMASTER_THRESHOLD_CRITICAL - Critical balance threshold in USD (default: 1)
 */

import * as dotenv from 'dotenv';

dotenv.config();

// Configuration
const CONFIG = {
  // Thresholds in USD
  LOW_BALANCE_THRESHOLD: parseFloat(process.env.PAYMASTER_THRESHOLD_LOW || '10'),
  CRITICAL_BALANCE_THRESHOLD: parseFloat(process.env.PAYMASTER_THRESHOLD_CRITICAL || '1'),

  // Poll interval in milliseconds
  POLL_INTERVAL: 300000, // 5 minutes

  // Pimlico API endpoints
  PIMLICO_API_BASE: 'https://api.pimlico.io/v2',
};

// Chain configurations
const CHAIN_CONFIG: Record<string, { name: string; chainSlug: string }> = {
  amoy: { name: 'Polygon Amoy Testnet', chainSlug: 'polygon-amoy' },
  polygon: { name: 'Polygon Mainnet', chainSlug: 'polygon' },
};

interface PaymasterBalance {
  remainingGasCreditsUsd: number;
  remainingGasCreditsWei: string;
  sponsorAddress: string;
}

interface MonitorResult {
  network: string;
  balanceUsd: number;
  balanceWei: string;
  sponsorAddress: string;
  status: 'normal' | 'low' | 'critical';
  timestamp: Date;
}

/**
 * Fetch paymaster balance from Pimlico API
 */
async function getPaymasterBalance(
  apiKey: string,
  chainSlug: string
): Promise<PaymasterBalance> {
  const url = `${CONFIG.PIMLICO_API_BASE}/${chainSlug}/rpc?apikey=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'pimlico_getBalance',
      params: [],
      id: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Pimlico API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Pimlico RPC error: ${data.error.message}`);
  }

  const result = data.result;
  return {
    remainingGasCreditsUsd: parseFloat(result.remainingGasCreditsUsd || '0'),
    remainingGasCreditsWei: result.remainingGasCreditsWei || '0',
    sponsorAddress: result.sponsorAddress || 'unknown',
  };
}

/**
 * Send alert to webhook (Slack/Discord compatible)
 */
async function sendAlert(result: MonitorResult): Promise<void> {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('[Alert would be sent if ALERT_WEBHOOK_URL was configured]');
    return;
  }

  const emoji =
    result.status === 'critical'
      ? '🚨'
      : result.status === 'low'
        ? '⚠️'
        : '✅';
  const statusText =
    result.status === 'critical'
      ? 'CRITICAL - Immediate action required!'
      : result.status === 'low'
        ? 'LOW BALANCE WARNING'
        : 'Normal';

  const message = {
    text: `${emoji} Paymaster Monitor Alert`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} Paymaster Monitor: ${statusText}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Network:*\n${result.network}`,
          },
          {
            type: 'mrkdwn',
            text: `*Balance:*\n$${result.balanceUsd.toFixed(2)} USD`,
          },
          {
            type: 'mrkdwn',
            text: `*Sponsor:*\n\`${result.sponsorAddress}\``,
          },
          {
            type: 'mrkdwn',
            text: `*Timestamp:*\n${result.timestamp.toISOString()}`,
          },
        ],
      },
      ...(result.status !== 'normal'
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text:
                  result.status === 'critical'
                    ? '🔴 *Action Required:* Add funds to Paymaster immediately to continue sponsoring transactions.'
                    : '🟡 *Recommended:* Consider adding funds to Paymaster soon.',
              },
            },
          ]
        : []),
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('Failed to send alert:', response.statusText);
    } else {
      console.log('Alert sent successfully');
    }
  } catch (error) {
    console.error('Error sending alert:', error);
  }
}

/**
 * Check paymaster balance and determine status
 */
async function checkPaymasterBalance(
  apiKey: string,
  networkName: string
): Promise<MonitorResult> {
  const chainConfig = CHAIN_CONFIG[networkName];
  if (!chainConfig) {
    throw new Error(`Unknown network: ${networkName}`);
  }

  const balance = await getPaymasterBalance(apiKey, chainConfig.chainSlug);

  let status: 'normal' | 'low' | 'critical' = 'normal';
  if (balance.remainingGasCreditsUsd <= CONFIG.CRITICAL_BALANCE_THRESHOLD) {
    status = 'critical';
  } else if (balance.remainingGasCreditsUsd <= CONFIG.LOW_BALANCE_THRESHOLD) {
    status = 'low';
  }

  return {
    network: chainConfig.name,
    balanceUsd: balance.remainingGasCreditsUsd,
    balanceWei: balance.remainingGasCreditsWei,
    sponsorAddress: balance.sponsorAddress,
    status,
    timestamp: new Date(),
  };
}

/**
 * Print status to console
 */
function printStatus(result: MonitorResult): void {
  const statusEmoji =
    result.status === 'critical'
      ? '🔴'
      : result.status === 'low'
        ? '🟡'
        : '🟢';

  console.log('\n' + '='.repeat(60));
  console.log(
    `${statusEmoji} Paymaster Monitor - ${result.timestamp.toLocaleString()}`
  );
  console.log('='.repeat(60));
  console.log(`Network:     ${result.network}`);
  console.log(`Sponsor:     ${result.sponsorAddress}`);
  console.log(`Balance:     $${result.balanceUsd.toFixed(4)} USD`);
  console.log(`Balance Wei: ${result.balanceWei}`);
  console.log(`Status:      ${result.status.toUpperCase()}`);
  console.log('='.repeat(60));
}

/**
 * Estimate remaining transactions
 */
function estimateRemainingTransactions(balanceUsd: number): {
  approxGasPerTx: number;
  estimatedTxCount: number;
} {
  // Rough estimates based on Polygon gas costs
  // Approve: ~46,000 gas, Saisen: ~100,000 gas
  // At 30 gwei and $0.50/MATIC, cost per full flow is roughly $0.004
  const approxCostPerTx = 0.004; // USD
  const estimatedTxCount = Math.floor(balanceUsd / approxCostPerTx);

  return {
    approxGasPerTx: 150000,
    estimatedTxCount,
  };
}

/**
 * Main monitoring function
 */
async function main(): Promise<void> {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const networkArg = args.find((arg) => arg.startsWith('--network='));
  const networkName = networkArg?.split('=')[1] || 'amoy';

  // Get API key from environment
  const apiKey = process.env.PIMLICO_API_KEY;
  if (!apiKey) {
    console.error('Error: PIMLICO_API_KEY not set in environment');
    console.log(
      'Get your API key at: https://dashboard.pimlico.io/'
    );
    process.exit(1);
  }

  const chainConfig = CHAIN_CONFIG[networkName];
  if (!chainConfig) {
    console.error(`Error: Unknown network "${networkName}"`);
    console.log(`Available networks: ${Object.keys(CHAIN_CONFIG).join(', ')}`);
    process.exit(1);
  }

  console.log('⛽ Paymaster Balance Monitor Started');
  console.log(`Network: ${chainConfig.name}`);
  console.log(`Low threshold: $${CONFIG.LOW_BALANCE_THRESHOLD} USD`);
  console.log(`Critical threshold: $${CONFIG.CRITICAL_BALANCE_THRESHOLD} USD`);
  console.log(`Poll interval: ${CONFIG.POLL_INTERVAL / 1000}s`);
  console.log('');

  // Check if running in one-shot mode
  const oneShot = args.includes('--once');

  if (oneShot) {
    // Single check mode
    try {
      const result = await checkPaymasterBalance(apiKey, networkName);
      printStatus(result);

      const estimates = estimateRemainingTransactions(result.balanceUsd);
      console.log(`\nEstimated remaining transactions: ~${estimates.estimatedTxCount}`);

      if (result.status !== 'normal') {
        await sendAlert(result);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Pimlico')) {
        console.error('\nError:', error.message);
        console.log('\nMake sure your PIMLICO_API_KEY is valid and has access to the specified network.');
      } else {
        throw error;
      }
    }
  } else {
    // Continuous monitoring mode
    let lastStatus: string | null = null;

    const monitor = async () => {
      try {
        const result = await checkPaymasterBalance(apiKey, networkName);
        printStatus(result);

        const estimates = estimateRemainingTransactions(result.balanceUsd);
        console.log(`Estimated remaining transactions: ~${estimates.estimatedTxCount}`);

        // Send alert only on status change or critical status
        if (result.status === 'critical' || (result.status !== 'normal' && result.status !== lastStatus)) {
          await sendAlert(result);
        }

        lastStatus = result.status;
      } catch (error) {
        console.error('Error checking paymaster balance:', error);
      }
    };

    // Initial check
    await monitor();

    // Set up interval
    setInterval(monitor, CONFIG.POLL_INTERVAL);

    console.log('\nMonitoring started. Press Ctrl+C to stop.');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
