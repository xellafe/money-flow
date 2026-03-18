import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';

export function AppLayout({ view, setView, collapsed, onToggle, onAddTransaction, children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        collapsed={collapsed}
        onToggle={onToggle}
        view={view}
        setView={setView}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-200 ease-in-out">
        <AppHeader
          view={view}
          onAddTransaction={onAddTransaction}
        />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
