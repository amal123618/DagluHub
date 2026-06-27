import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC3cT51NffiIpxoBe6_yZFRHlwthxtzh8pUlybWgYAyW5IkCtFn8nf_SwHFy5ekVx7v4g-sGKtWMInDfa1-jBanU7OkU1pvl6K4dY1dA2V0MfV_mX4HcjQv6iATWLG1-609_2_zGGnMhrNk3TUfkePLu7eHvkHfP8mlGhhQHnGv2zH2ILHzMHiZnWy3xszBDHQd69DcW_xyRVVdTrW54Eo-lbvRA7wCOIS-AL-ldPv54Sj1oG9oLKcDl8GZ32_J3Ymq0TF5U9wxJsD7'

const NAV_LINKS = [
  { label: 'Browse', to: '/' },
  { label: 'Learning Path', to: '/learning-path/1' },
  { label: 'Certifications', to: '/dashboard' },
]


export default function Navbar() {
  const { user, isAuthenticated, login, logout } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [username, setUsername] = useState('learner')
  const [password, setPassword] = useState('learnerpass123')
  const [authError, setAuthError] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 w-full z-50 bg-surface transition-shadow duration-200 ${
        scrolled ? 'shadow-md' : 'shadow-sm'
      }`}
    >
      <div className="flex justify-between items-center h-16 px-gutter max-w-container-max mx-auto">
        {/* Brand + Desktop Nav */}
        <div className="flex items-center gap-xl">
          <Link
            to="/"
            className="font-display text-headline-md font-bold text-primary tracking-tight"
          >
            DAGLUHUB
          </Link>

          <div className="hidden md:flex items-center gap-lg">
            {NAV_LINKS.map(({ label, to }) => {
              const isActive =
                to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(to) && to !== '#'
              return (
                <Link
                  key={label}
                  to={to}
                  className={`text-label-md font-semibold transition-colors ${
                    isActive
                      ? 'text-primary border-b-2 border-primary pb-1'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Search + Actions */}
        <div className="flex items-center gap-md">
          {/* Search bar */}
          <div
            className={`relative hidden lg:block transition-transform duration-200 ${
              searchFocused ? 'scale-105' : ''
            }`}
          >
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search skills..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="h-10 pl-10 pr-4 rounded-lg bg-surface-container-low border border-outline-variant focus:ring-2 focus:ring-primary focus:border-primary w-64 text-body-sm outline-none"
            />
          </div>

          <div className="flex items-center gap-sm">
            <button
              className="p-2 hover:bg-surface-container-low rounded-lg transition-all"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-on-surface-variant">
                notifications
              </span>
            </button>
            <button
              className="p-2 hover:bg-surface-container-low rounded-lg transition-all"
              aria-label="Bookmarks"
            >
              <span className="material-symbols-outlined text-on-surface-variant">
                bookmark
              </span>
            </button>

            {/* Auth Conditional Rendering */}
            {isAuthenticated ? (
              <div className="flex items-center gap-sm">
                <Link to="/dashboard" className="ml-2 block" title="Go to Dashboard">
                  <div className="h-8 w-8 rounded-full overflow-hidden border border-outline-variant cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                    <img
                      src={AVATAR}
                      alt="User avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
                <button
                  onClick={logout}
                  className="px-sm py-1.5 border border-outline rounded-lg text-label-sm font-semibold text-on-surface-variant hover:text-primary hover:border-primary transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthError('')
                  setShowLoginModal(true)
                }}
                className="h-10 px-md bg-secondary text-on-secondary rounded-lg text-label-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Login Modal Overlay */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-xl rounded-2xl w-full max-w-sm border border-outline-variant/30 shadow-2xl relative text-on-background">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <h3 className="font-display text-headline-sm text-primary mb-md font-bold">Sign In</h3>

            {authError && (
              <div className="mb-md p-sm bg-error-container text-on-error-container rounded-lg text-body-sm flex items-center gap-xs">
                <span className="material-symbols-outlined text-sm">warning</span>
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-md">
              <div>
                <label className="block text-label-sm text-on-surface-variant mb-1 font-semibold">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-10 px-md rounded-lg border border-outline focus:ring-2 focus:ring-primary focus:border-primary outline-none text-body-sm"
                />
              </div>

              <div>
                <label className="block text-label-sm text-on-surface-variant mb-1 font-semibold">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 px-md rounded-lg border border-outline focus:ring-2 focus:ring-primary focus:border-primary outline-none text-body-sm"
                />
              </div>

              <button
                onClick={async () => {
                  try {
                    setAuthError('')
                    await login(username, password)
                    setShowLoginModal(false)
                  } catch (err) {
                    setAuthError(err.data?.error || err.message || 'Invalid credentials.')
                  }
                }}
                className="w-full h-11 bg-primary text-on-primary rounded-lg text-label-md font-bold hover:opacity-95 transition-opacity mt-lg"
              >
                Login
              </button>

              <p className="text-[11px] text-center text-on-surface-variant opacity-80 mt-md">
                Demo Seeding Account: <strong className="text-secondary font-bold">learner / learnerpass123</strong>
              </p>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
