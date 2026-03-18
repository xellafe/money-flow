import { motion } from 'framer-motion';
import { LayoutDashboard, ArrowLeftRight, Settings, ChevronLeft } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',    Icon: LayoutDashboard },
  { id: 'transactions', label: 'Transazioni',  Icon: ArrowLeftRight },
  { id: 'settings',     label: 'Impostazioni', Icon: Settings },
];

export function Sidebar({ collapsed, onToggle, view, setView }) {
  return (
    <motion.div
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-screen flex flex-col bg-white border-r border-gray-200 overflow-hidden shrink-0"
    >
      {/* Logo / App name */}
      <div className="h-14 flex items-center px-4 border-b border-gray-200 shrink-0">
        <span className="text-brand-500 font-semibold truncate">
          {collapsed ? 'M' : 'MoneyFlow'}
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            aria-label={label}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold
              transition-colors duration-150 cursor-pointer
              ${view === id
                ? 'bg-brand-500/10 text-brand-500'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
            `}
          >
            <Icon size={20} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </button>
        ))}
      </nav>

      {/* Toggle button — bottom */}
      <div className="p-2 border-t border-gray-200 shrink-0">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-150 cursor-pointer"
          aria-label={collapsed ? 'Espandi sidebar' : 'Comprimi sidebar'}
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <ChevronLeft size={20} />
          </motion.div>
        </button>
      </div>
    </motion.div>
  );
}
