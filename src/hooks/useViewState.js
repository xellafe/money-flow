import { useState } from 'react';

/**
 * Hook per gestire lo stato della navigazione e della sidebar.
 * view: 'dashboard' | 'transactions' | 'settings'
 * sidebarCollapsed: boolean, persisted to localStorage key 'sidebarCollapsed'
 */
export function useViewState() {
  const [view, setView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('sidebarCollapsed', String(next)); } catch { /* ignore */ }
      return next;
    });
  };

  return { view, setView, sidebarCollapsed, setSidebarCollapsed, toggleSidebar };
}

export default useViewState;
