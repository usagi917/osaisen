import { motion } from 'framer-motion';
import { WalletConnect } from './WalletConnect';

export type AppPage = 'saisen' | 'mypage';

interface AppHeaderProps {
  activePage: AppPage;
  onChange: (page: AppPage) => void;
  showMyPage: boolean;
}

export function AppHeader({ activePage, onChange, showMyPage }: AppHeaderProps) {
  return (
    <header className="mb-12 sm:mb-16">
      <div className="flex items-start justify-between">
        {/* Logo - Vertical Japanese aesthetic */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-start gap-4"
        >
          {/* Shrine name in vertical */}
          <div className="writing-vertical font-serif text-sm tracking-[0.3em] text-washi/60 hidden sm:block">
            白山比咩神社
          </div>

          {/* Main logo */}
          <div className="flex flex-col">
            <h1 className="font-serif text-2xl sm:text-3xl tracking-[0.1em] text-washi leading-none">
              御賽銭
            </h1>
            <p className="font-mono text-[10px] tracking-[0.3em] text-washi/40 mt-2 uppercase">
              Digital Osaisen
            </p>
          </div>
        </motion.div>

        {/* Right side: Navigation + Wallet */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="flex items-center gap-3 sm:gap-4"
        >
          {showMyPage && (
            <nav className="flex items-center">
              <button
                type="button"
                onClick={() => onChange(activePage === 'saisen' ? 'mypage' : 'saisen')}
                className="group relative font-mono text-xs tracking-[0.15em] uppercase text-washi/60 hover:text-washi transition-colors duration-300 py-2 px-3"
              >
                <span className="relative z-10">
                  {activePage === 'saisen' ? '御朱印帳' : '奉納'}
                </span>
                <motion.div
                  className="absolute bottom-1 left-3 right-3 h-px bg-shu"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </button>
            </nav>
          )}

          <WalletConnect />
        </motion.div>
      </div>
    </header>
  );
}
