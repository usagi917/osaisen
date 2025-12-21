import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './lib/wagmiConfig';
import { AppHeader, type AppPage } from './components/AppHeader';
import { MyPage } from './pages/MyPage';
import { SaisenPage } from './pages/Saisen';

const queryClient = new QueryClient();

const getPageFromHash = (): AppPage => {
  if (typeof window === 'undefined') return 'saisen';
  const hash = window.location.hash.replace('#', '');
  if (hash === 'mypage') return 'mypage';
  return 'saisen';
};

function AppShell() {
  const { isConnected } = useAccount();
  const [activePage, setActivePage] = useState<AppPage>(() => getPageFromHash());

  const canShowMyPage = useMemo(() => isConnected, [isConnected]);

  useEffect(() => {
    const handleHashChange = () => setActivePage(getPageFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!canShowMyPage && activePage === 'mypage') {
      setActivePage('saisen');
      if (typeof window !== 'undefined' && window.location.hash !== '#saisen') {
        window.location.hash = 'saisen';
      }
    }
  }, [activePage, canShowMyPage]);

  const handleChangePage = useCallback(
    (page: AppPage) => {
      const nextPage = !canShowMyPage && page === 'mypage' ? 'saisen' : page;
      setActivePage(nextPage);
      if (typeof window !== 'undefined') {
        const nextHash = nextPage === 'mypage' ? 'mypage' : 'saisen';
        if (window.location.hash !== `#${nextHash}`) {
          window.location.hash = nextHash;
        }
      }
    },
    [canShowMyPage]
  );

  return (
    <div className="min-h-[100dvh] relative flex flex-col p-6 max-w-lg mx-auto bg-md-surface text-md-on-surface font-sans">
      <AppHeader
        activePage={activePage}
        onChange={handleChangePage}
        showMyPage={canShowMyPage}
      />
      {activePage === 'saisen' ? <SaisenPage /> : <MyPage />}
      <footer className="mt-8 text-center pb-safe">
        <p className="text-xs text-md-on-surface-variant opacity-60 font-mono">
          POWERED BY kuroko
        </p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AppShell />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
