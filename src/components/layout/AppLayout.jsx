import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';

/**
 * Root layout wrapper: sidebar + header + main content area.
 * @param {{
 *   view: string,
 *   setView: (v: string) => void,
 *   collapsed: boolean,
 *   onToggle: () => void,
 *   onAddTransaction: () => void,
 *   selectedMonth: number|null,
 *   selectedYear: number,
 *   onPrevYear: () => void,
 *   onNextYear: () => void,
 *   onSelectMonth: (month: number) => void,
 *   availableMonths: Set<number>,
 *   children: React.ReactNode
 * }} props
 */
export function AppLayout({
  view,
  setView,
  collapsed,
  onToggle,
  onAddTransaction,
  selectedMonth,
  selectedYear,
  onPrevYear,
  onNextYear,
  onSelectMonth,
  availableMonths,
  children,
}) {
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
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onPrevYear={onPrevYear}
          onNextYear={onNextYear}
          onSelectMonth={onSelectMonth}
          availableMonths={availableMonths}
        />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </motion.div>
    </div>
  );
}
