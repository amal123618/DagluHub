/**
 * StatCard — metric tile on the Dashboard stats row.
 *
 * Props:
 *   icon      {string}  - Material Symbol name
 *   label     {string}  - e.g. "Time Learned"
 *   value     {string}  - e.g. "4.5h"
 *   iconColor {string}  - Tailwind text color class, e.g. "text-primary"
 */
export default function StatCard({ icon, label, value, iconColor = 'text-primary' }) {
  return (
    <div className="bg-white p-lg rounded-xl flex items-center gap-lg border border-outline-variant/30 card-shadow">
      <div
        className={`w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center shrink-0 ${iconColor}`}
      >
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="text-label-sm text-on-surface-variant">{label}</p>
        <p className="font-display text-headline-sm text-primary">{value}</p>
      </div>
    </div>
  )
}
