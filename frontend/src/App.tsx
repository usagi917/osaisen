import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
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
    <div className="min-h-[100dvh] relative flex flex-col grain-overlay">
      {/* Subtle gradient accent */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-shu/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col min-h-[100dvh] px-6 py-8 sm:px-8 sm:py-10 max-w-2xl mx-auto w-full">
        <AppHeader
          activePage={activePage}
          onChange={handleChangePage}
          showMyPage={canShowMyPage}
        />

        <AnimatePresence mode="wait">
          <motion.main
            key={activePage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col"
          >
            {activePage === 'saisen' ? <SaisenPage /> : <MyPage />}
          </motion.main>
        </AnimatePresence>

        <footer className="mt-auto pt-16 pb-safe">
          <div className="zen-divider mb-6" />
          <div className="flex items-center justify-between text-[10px] tracking-[0.2em] uppercase text-washi/30 font-mono">
            <span>Osaisen</span>
            <span>Powered by Kuroko</span>
          </div>
        </footer>
      </div>
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
