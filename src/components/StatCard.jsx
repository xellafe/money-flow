import { formatCurrency } from '../utils';

/**
 * Card per visualizzazione statistiche
 * @param {Object} props
 * @param {string} props.label - Etichetta
 * @param {number} props.value - Valore
 * @param {React.ComponentType} props.icon - Icona Lucide
 * @param {'positive'|'negative'} props.type - Tipo di stat
 */
export default function StatCard({ label, value, icon: Icon, type }) {
  return (
    <div className={`stat-card ${type}`}>
      <div className="stat-label">
        {Icon && <Icon size={18} />}
        {label}
      </div>
      <div className={`stat-value ${type}`}>{formatCurrency(value)}</div>
    </div>
  );
}
