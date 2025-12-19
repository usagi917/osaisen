import { http, createConfig } from 'wagmi';
import { polygonAmoy, polygon, hardhat } from 'wagmi/chains';
import { metaMask, walletConnect } from 'wagmi/connectors';

// WalletConnect project ID (get one at https://cloud.walletconnect.com/)
const projectId = (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '').trim();
export const isWalletConnectEnabled = projectId.length > 0;
const appUrl =
  import.meta.env.VITE_APP_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://osaisen.example.com');
const appIcon = import.meta.env.VITE_APP_ICON || `${appUrl}/vite.svg`;

export const config = createConfig({
  multiInjectedProviderDiscovery: false,
  chains: [polygonAmoy, polygon, hardhat],
  connectors: [
    ...(isWalletConnectEnabled
      ? [
          walletConnect({
            projectId,
            showQrModal: true,
            metadata: {
              name: 'Osaisen',
              description: 'Digital saisen + monthly NFT',
              url: appUrl,
              icons: [appIcon],
            },
          }),
        ]
      : []),
    metaMask({
      dappMetadata: {
        name: 'Osaisen',
        url: appUrl,
      },
    }),
  ],
  transports: {
    [polygonAmoy.id]: http(),
    [polygon.id]: http(),
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
