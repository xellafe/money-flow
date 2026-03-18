import { motion } from 'framer-motion';
import { LayoutDashboard, ArrowLeftRight, Settings, Menu } from 'lucide-react';

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
      {/* Header: hamburger flush at px-4, same as nav items */}
      <div className={`h-14 flex items-center border-b border-gray-200 shrink-0 ${collapsed ? 'justify-center' : 'px-4 gap-3'}`}>
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Espandi sidebar' : 'Comprimi sidebar'}
          className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-150 cursor-pointer shrink-0"
        >
          <Menu size={20} />
        </button>
        {!collapsed && (
          <span className="text-brand-500 font-semibold truncate">MoneyFlow</span>
        )}
      </div>

      {/* Nav items — px-4 on container mirrors header; buttons remove their own px */}
      <nav className="flex-1 py-4 space-y-1 px-4">
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            aria-label={label}
            className={`
              w-full flex items-center py-2 rounded-lg text-sm font-semibold
              transition-colors duration-150 cursor-pointer
              ${collapsed ? 'justify-center' : 'gap-3'}
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
    </motion.div>
  );
}
