import { motion } from 'framer-motion';
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

      <motion.div
        layout
        transition={{ layout: { duration: 0.2, ease: 'easeInOut' } }}
        className="flex-1 flex flex-col min-w-0 overflow-hidden"
      >
        <AppHeader
          view={view}
          onAddTransaction={onAddTransaction}
        />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </motion.div>
    </div>
  );
}
