import React from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '@/features/auth/authStore';
import useLangStore from '@/shared/i18n/langStore';

const TopAppBar = ({
  title,
  variant = 'default',
  showGuestActions = false,
}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { lang, setLang, t } = useLangStore();
  const isPublicVariant = variant === 'public';

  if (isAuthenticated && !isPublicVariant) {
    return null;
  }

  const displayTitle = title || t('common.appTitle');
  const headerClasses = isPublicVariant
    ? 'absolute top-4 left-4 right-4 z-40 h-14'
    : 'fixed top-4 right-4 left-4 md:left-[376px] h-16 z-50';

  return (
    <header className={`${headerClasses} rounded-xl bg-surface/90 backdrop-blur-md border border-outline-variant shadow-md flex justify-between items-center px-3 sm:px-6 transition-all`}>
      <div className="flex min-w-0 items-center gap-3">
        {isPublicVariant && (
          <div className="w-9 h-9 shrink-0 rounded-lg bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
          </div>
        )}
        <span className="font-headline-md text-headline-md font-black text-primary truncate">{displayTitle}</span>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        {showGuestActions && (
          <>
            <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant">
              <button
                className={`w-10 h-7 text-xs rounded font-label-md text-label-md flex items-center justify-center ${lang === 'en' ? 'bg-primary text-on-primary' : 'text-on-surface'}`}
                onClick={() => setLang('en')}
                type="button"
              >
                EN
              </button>
              <button
                className={`w-10 h-7 text-xs rounded font-label-md text-label-md flex items-center justify-center ${lang === 'es' ? 'bg-primary text-on-primary' : 'text-on-surface'}`}
                onClick={() => setLang('es')}
                type="button"
              >
                ES
              </button>
            </div>
            <Link className="h-10 px-3 sm:min-w-[164px] sm:px-4 bg-primary text-on-primary rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 shadow-sm hover:bg-primary/90 transition-colors whitespace-nowrap" to="/login">
              <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
              <span className="hidden sm:inline">{t('guest.adminLogin')}</span>
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default TopAppBar;
