import clsx from 'clsx';
import { WalletConnect } from './WalletConnect';

export type AppPage = 'saisen' | 'mypage';

interface AppHeaderProps {
  activePage: AppPage;
  onChange: (page: AppPage) => void;
  showMyPage: boolean;
}

export function AppHeader({ activePage, onChange, showMyPage }: AppHeaderProps) {
  const tabBase =
    'px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-full transition-colors state-layer';

  return (
    <header className="mb-6 sm:mb-8 relative z-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div className="flex justify-between items-start sm:block">
          <div>
            <h1 className="text-xl sm:type-headline-medium font-bold tracking-tight leading-none text-md-primary">
              HAKUSAN<br />HIME
            </h1>
            <p className="text-xs sm:type-label-large text-md-secondary font-bold tracking-[0.2em] mt-1 opacity-80">
              白山比咩神社
            </p>
          </div>
          <div className="sm:hidden">
            <WalletConnect />
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <WalletConnect />
          </div>
          {showMyPage && (
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-md-surface-container-high border border-md-outline-variant/30">
              <button
                type="button"
                onClick={() => onChange('mypage')}
                aria-current={activePage === 'mypage' ? 'page' : undefined}
                className={clsx(
                  tabBase,
                  activePage === 'mypage'
                    ? 'bg-md-blue-container text-md-on-blue-container shadow-sm'
                    : 'text-md-blue hover:text-white hover:bg-md-blue-container/40'
                )}
              >
                マイページ
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
