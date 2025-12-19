import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './lib/wagmiConfig';
import { SaisenPage } from './pages/Saisen';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <SaisenPage />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
