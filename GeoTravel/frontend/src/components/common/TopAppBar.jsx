import React from 'react';
import useAuthStore from '../../store/authStore';
import useLangStore from '../../store/langStore';

const TopAppBar = ({ title }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { t } = useLangStore();

  if (isAuthenticated) {
    return null;
  }

  const displayTitle = title || t('common.appTitle');

  return (
    <header className="fixed top-4 right-4 left-4 md:left-[376px] rounded-xl bg-surface-container-low backdrop-blur-md border border-outline-variant shadow-md flex justify-between items-center px-6 h-16 z-50 transition-all">
      <div className="flex items-center gap-4">
        <span className="font-headline-md text-headline-md font-black text-primary">{displayTitle}</span>
      </div>
    </header>
  );
};

export default TopAppBar;
