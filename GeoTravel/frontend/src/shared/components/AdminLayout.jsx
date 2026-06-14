import React, { useState } from 'react';
import Sidebar from '@/shared/components/Sidebar';

const AdminLayout = ({ activeItem, children, mainClassName = '' }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md overflow-hidden h-screen w-screen flex">
      <Sidebar
        activeItem={activeItem}
        isOpen={isSidebarOpen}
        onNavigate={() => setIsSidebarOpen(false)}
      />

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar navegación"
          className="fixed inset-0 z-[45] bg-black/40 backdrop-blur-[1px] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <button
        type="button"
        aria-label="Abrir navegación"
        className={`fixed left-4 top-4 z-50 h-11 w-11 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface shadow-md items-center justify-center lg:hidden ${isSidebarOpen ? 'hidden' : 'flex'}`}
        onClick={() => setIsSidebarOpen(true)}
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      <main className={`relative h-full min-w-0 flex-1 lg:ml-[360px] ${mainClassName}`}>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
