import { motion } from 'framer-motion';
import { LayoutDashboard, ArrowLeftRight, Settings, ChevronLeft } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',    Icon: LayoutDashboard },
  { id: 'transactions', label: 'Transazioni',  Icon: ArrowLeftRight },
  { id: 'settings',     label: 'Impostazioni', Icon: Settings },
];

export function Sidebar({ collapsed, onToggle, view, setView }) {
  return (
    // Outer motion.div drives width animation; relative + overflow-visible lets the edge button escape
    <motion.div
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative h-screen shrink-0"
    >
      {/* Inner div keeps overflow-hidden so labels clip cleanly during animation */}
      <div className="h-full flex flex-col bg-white border-r border-gray-200 overflow-hidden">
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
                w-full flex items-center py-2 rounded-lg text-sm font-semibold
                transition-colors duration-150 cursor-pointer
                ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'}
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
      </div>

      {/* Edge toggle button — overlaps the sidebar's right border, vertically centered */}
      <button
        onClick={onToggle}
        aria-label={collapsed ? 'Espandi sidebar' : 'Comprimi sidebar'}
        className="absolute top-1/2 right-0 z-10 flex items-center justify-center
                   w-5 h-5 -translate-y-1/2 translate-x-1/2
                   bg-white border border-gray-200 rounded-full shadow-sm
                   text-gray-400 hover:text-gray-700 hover:bg-gray-50
                   transition-colors duration-150 cursor-pointer"
      >
        <motion.div
          animate={{ rotate: collapsed ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <ChevronLeft size={12} />
        </motion.div>
      </button>
    </motion.div>
  );
}
