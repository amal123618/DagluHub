import { Link, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { icon: 'dashboard', label: 'Dashboard', to: '/dashboard', fill: true },
  { icon: 'school', label: 'My Courses', to: '#' },
  { icon: 'leaderboard', label: 'Progress', to: '#' },
  { icon: 'groups', label: 'Community', to: '#' },
  { icon: 'settings', label: 'Settings', to: '#' },
]

export default function Sidebar() {
  const { pathname } = useLocation()

  return (
    <aside className="hidden md:flex flex-col w-64 fixed left-0 top-16 bottom-0 bg-surface-container-low border-r border-outline-variant py-lg z-30 overflow-y-auto">
      {/* Hub Identity */}
      <div className="px-lg mb-lg">
        <div className="flex items-center gap-md">
          <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-primary-container icon-filled">
              school
            </span>
          </div>
          <div>
            <h2 className="font-display text-headline-sm text-primary leading-tight">
              Learning Hub
            </h2>
            <p className="text-label-sm text-on-surface-variant">
              Micro-learning enabled
            </p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-grow space-y-1 px-2">
        {NAV_ITEMS.map(({ icon, label, to, fill }) => {
          const isActive = pathname === to
          return (
            <Link
              key={label}
              to={to}
              className={`flex items-center gap-md px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span
                className={`material-symbols-outlined ${
                  isActive && fill ? 'icon-filled' : ''
                }`}
              >
                {icon}
              </span>
              <span className="text-label-md font-semibold">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Premium Upsell */}
      <div className="px-lg mt-auto pt-lg">
        <div className="bg-primary text-on-primary p-md rounded-xl space-y-md">
          <div className="flex items-center gap-sm mb-xs">
            <span className="material-symbols-outlined text-sm icon-filled">
              workspace_premium
            </span>
            <p className="text-label-md font-semibold">Go Premium</p>
          </div>
          <p className="text-label-sm opacity-80">
            Unlock full access to 500+ courses and live mentoring.
          </p>
          <button className="w-full bg-secondary text-on-secondary py-2 rounded-lg text-label-md font-semibold hover:opacity-90 transition-opacity">
            Upgrade Now
          </button>
        </div>
      </div>
    </aside>
  )
}
