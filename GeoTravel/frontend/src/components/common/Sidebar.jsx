import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useLangStore from '../../store/langStore';

const Sidebar = ({ activeItem }) => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { t } = useLangStore();

  const handleLogout = () => {
    logout();
    navigate('/guest');
  };
  const items = [
    { id: 'zones', label: t('common.zones'), icon: 'map', href: '/zones' },
    { id: 'routes', label: t('common.routes'), icon: 'route', href: '/routes' },
    { id: 'attractions', label: t('common.attractions'), icon: 'photo_library', href: '/attractions' },
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-[360px] bg-surface border-r border-border-subtle flex flex-col py-6 z-40">
      <div className="px-6 pb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-headline-md text-headline-md">
            GA
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary">GeoTravel GIS</h1>
            <p className="font-label-md text-label-md text-on-surface-variant">{t('auth.adminPortal')}</p>
          </div>
        </div>
      </div>

      <ul className="flex flex-col flex-grow gap-1 overflow-y-auto px-2">
        {items.map(item => (
          <li key={item.id}>
            <a 
              className={`flex items-center gap-3 px-4 py-3 transition-colors duration-200 ${
                activeItem === item.id 
                  ? 'bg-primary-container text-on-primary-container rounded-r-full border-l-4 border-primary scale-[0.98] transition-transform duration-150'
                  : 'text-on-surface-variant hover:bg-surface-container-high rounded-full'
              }`} 
              href={item.href}
            >
              <span className="material-symbols-outlined" style={activeItem === item.id ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span className="font-label-md text-label-md">{item.label}</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="px-2 mt-auto space-y-1 pt-4 border-t border-outline-variant">
        <button className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors duration-200" onClick={handleLogout} type="button">
          <span className="material-symbols-outlined">logout</span>
          <span className="font-label-md text-label-md">{t('common.logout')}</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
