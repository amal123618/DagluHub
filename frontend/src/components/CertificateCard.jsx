/**
 * CertificateCard — certificate tile with hover overlay for download/share.
 *
 * Props:
 *   title       {string}  - e.g. "Mastering UI Fundamentals"
 *   subtitle    {string}  - e.g. "Design Academy"
 *   date        {string}  - e.g. "Completed Dec 12, 2023"
 *   accent      {string}  - Tailwind color token: "primary" | "secondary"
 */
import { Link } from 'react-router-dom'

export default function CertificateCard({ uuid, title, subtitle, date, accent = 'primary' }) {
  const iconColor   = accent === 'secondary' ? 'text-secondary' : 'text-primary'
  const borderColor = accent === 'secondary' ? 'border-secondary/20' : 'border-primary/20'
  const bgGradient  = accent === 'secondary'
    ? 'from-secondary to-transparent'
    : 'from-primary to-transparent'

  const cardBody = (
    <div className="bg-white p-md rounded-xl border border-outline-variant/30 space-y-md card-shadow transition-all duration-300 hover:-translate-y-1 group">

      {/* Certificate preview */}
      <div className="relative aspect-[4/3] bg-surface-container rounded-lg overflow-hidden flex items-center justify-center p-md">
        {/* Background radial gradient */}
        <div
          className={`absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${bgGradient}`}
        />

        {/* Certificate body */}
        <div
          className={`border-2 ${borderColor} w-full h-full rounded flex flex-col items-center justify-center p-sm text-center z-10`}
        >
          <span
            className={`material-symbols-outlined ${iconColor} icon-filled mb-xs`}
            style={{ fontSize: '48px' }}
          >
            verified
          </span>
          <p className="font-display text-sm text-primary leading-tight">{title}</p>
          <p className="text-[10px] text-on-surface-variant mt-1">{date}</p>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-primary/85 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-md z-20">
          <button
            aria-label="Download certificate"
            className="bg-surface text-primary w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            <span className="material-symbols-outlined">download</span>
          </button>
          <button
            aria-label="Share certificate"
            className="bg-surface text-primary w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center px-xs">
        <div>
          <p className="text-label-md font-semibold text-primary">{subtitle.split('·')[0]}</p>
          <p className="text-label-sm text-on-surface-variant">{subtitle}</p>
        </div>
        <span className="material-symbols-outlined text-secondary icon-filled">check_circle</span>
      </div>
    </div>
  )

  if (uuid) {
    return <Link to={`/certificate/${uuid}`} className="block">{cardBody}</Link>
  }

  return cardBody
}

