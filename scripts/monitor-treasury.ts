/**
 * Treasury Balance Monitoring Script
 *
 * Monitors the JPYC balance of the treasury address and sends alerts
 * when thresholds are reached.
 *
 * Usage:
 *   npx ts-node scripts/monitor-treasury.ts [--network amoy|polygon]
 *
 * Environment variables:
 *   TREASURY_ADDRESS - Treasury wallet address
 *   JPYC_ADDRESS_AMOY / JPYC_ADDRESS_MAINNET - JPYC contract address
 *   ALERT_WEBHOOK_URL - Optional: Webhook URL for alerts (Slack/Discord)
 *   ALERT_THRESHOLD_LOW - Low balance threshold in JPYC (default: 10000)
 *   ALERT_THRESHOLD_HIGH - High balance threshold in JPYC (default: 1000000)
 */

import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

// Configuration
const CONFIG = {
  // Thresholds in JPYC (will be converted to wei)
  LOW_BALANCE_THRESHOLD: BigInt(process.env.ALERT_THRESHOLD_LOW || '10000'),
  HIGH_BALANCE_THRESHOLD: BigInt(process.env.ALERT_THRESHOLD_HIGH || '1000000'),

  // Poll interval in milliseconds
  POLL_INTERVAL: 60000, // 1 minute

  // JPYC decimals
  DECIMALS: 18,
};

// JPYC mainnet address
const JPYC_MAINNET = '0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB';

// ERC20 ABI for balance checking
const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

interface MonitorResult {
  treasuryAddress: string;
  jpycAddress: string;
  balance: bigint;
  balanceFormatted: string;
  status: 'normal' | 'low' | 'high';
  timestamp: Date;
  network: string;
}

/**
 * Format balance with decimals
 */
function formatBalance(balance: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const whole = balance / divisor;
  const fraction = balance % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 2);
  return `${whole.toLocaleString()}.${fractionStr}`;
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

  const emoji = result.status === 'low' ? '⚠️' : result.status === 'high' ? '💰' : '✅';
  const statusText =
    result.status === 'low'
      ? 'LOW BALANCE WARNING'
      : result.status === 'high'
        ? 'High balance detected'
        : 'Normal';

  const message = {
    text: `${emoji} Treasury Monitor Alert`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} Treasury Monitor: ${statusText}`,
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
            text: `*Balance:*\n${result.balanceFormatted} JPYC`,
          },
          {
            type: 'mrkdwn',
            text: `*Treasury:*\n\`${result.treasuryAddress}\``,
          },
          {
            type: 'mrkdwn',
            text: `*Timestamp:*\n${result.timestamp.toISOString()}`,
          },
        ],
      },
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
 * Check treasury balance
 */
async function checkTreasuryBalance(
  treasuryAddress: string,
  jpycAddress: string,
  networkName: string
): Promise<MonitorResult> {
  const jpyc = await ethers.getContractAt(ERC20_ABI, jpycAddress);

  const balance = await jpyc.balanceOf(treasuryAddress);
  const decimals = await jpyc.decimals();

  const lowThreshold = CONFIG.LOW_BALANCE_THRESHOLD * BigInt(10 ** decimals);
  const highThreshold = CONFIG.HIGH_BALANCE_THRESHOLD * BigInt(10 ** decimals);

  let status: 'normal' | 'low' | 'high' = 'normal';
  if (balance < lowThreshold) {
    status = 'low';
  } else if (balance > highThreshold) {
    status = 'high';
  }

  return {
    treasuryAddress,
    jpycAddress,
    balance,
    balanceFormatted: formatBalance(balance, decimals),
    status,
    timestamp: new Date(),
    network: networkName,
  };
}

/**
 * Print status to console
 */
function printStatus(result: MonitorResult): void {
  const statusEmoji =
    result.status === 'low' ? '🔴' : result.status === 'high' ? '🟡' : '🟢';

  console.log('\n' + '='.repeat(60));
  console.log(`${statusEmoji} Treasury Monitor - ${result.timestamp.toLocaleString()}`);
  console.log('='.repeat(60));
  console.log(`Network:     ${result.network}`);
  console.log(`Treasury:    ${result.treasuryAddress}`);
  console.log(`JPYC:        ${result.jpycAddress}`);
  console.log(`Balance:     ${result.balanceFormatted} JPYC`);
  console.log(`Status:      ${result.status.toUpperCase()}`);
  console.log('='.repeat(60));
}

/**
 * Main monitoring function
 */
async function main(): Promise<void> {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const networkArg = args.find((arg) => arg.startsWith('--network='));
  const networkName = networkArg?.split('=')[1] || 'amoy';

  // Get addresses from environment
  const treasuryAddress = process.env.TREASURY_ADDRESS;
  if (!treasuryAddress) {
    console.error('Error: TREASURY_ADDRESS not set in environment');
    process.exit(1);
  }

  let jpycAddress: string;
  if (networkName === 'polygon' || networkName === 'mainnet') {
    jpycAddress = JPYC_MAINNET;
  } else {
    jpycAddress = process.env.JPYC_ADDRESS_AMOY || '';
    if (!jpycAddress) {
      console.error('Error: JPYC_ADDRESS_AMOY not set in environment');
      process.exit(1);
    }
  }

  console.log('🏛️ Treasury Balance Monitor Started');
  console.log(`Network: ${networkName}`);
  console.log(`Treasury: ${treasuryAddress}`);
  console.log(`JPYC: ${jpycAddress}`);
  console.log(`Low threshold: ${CONFIG.LOW_BALANCE_THRESHOLD.toLocaleString()} JPYC`);
  console.log(`High threshold: ${CONFIG.HIGH_BALANCE_THRESHOLD.toLocaleString()} JPYC`);
  console.log(`Poll interval: ${CONFIG.POLL_INTERVAL / 1000}s`);
  console.log('');

  // Check if running in one-shot mode
  const oneShot = args.includes('--once');

  if (oneShot) {
    // Single check mode
    const result = await checkTreasuryBalance(treasuryAddress, jpycAddress, networkName);
    printStatus(result);

    if (result.status !== 'normal') {
      await sendAlert(result);
    }
  } else {
    // Continuous monitoring mode
    let lastStatus: string | null = null;

    const monitor = async () => {
      try {
        const result = await checkTreasuryBalance(
          treasuryAddress,
          jpycAddress,
          networkName
        );
        printStatus(result);

        // Send alert only on status change
        if (result.status !== 'normal' && result.status !== lastStatus) {
          await sendAlert(result);
        }

        lastStatus = result.status;
      } catch (error) {
        console.error('Error checking balance:', error);
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
