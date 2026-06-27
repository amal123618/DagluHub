import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import CertificateCard from '../components/CertificateCard'
import ScheduleItem from '../components/ScheduleItem'
import useApi from '../hooks/useApi'
import { getProgress, getCertificates, trackProgress, claimCertificate } from '../api/user'
import { useAuth } from '../context/AuthContext'


// ── Data ────────────────────────────────────────────────────────────────────
const STATS = [
  { icon: 'schedule', label: 'Time Learned', value: '4.5h', iconColor: 'text-primary' },
  { icon: 'auto_stories', label: 'Courses', value: '2', iconColor: 'text-secondary' },
  { icon: 'fact_check', label: 'Quizzes Passed', value: '12', iconColor: 'text-on-tertiary-container' },
]

const CERTIFICATES = [
  { title: 'Mastering UI Fundamentals', subtitle: 'Design Academy', date: 'Completed Dec 12, 2023', accent: 'primary' },
  { title: 'Agile Project Management', subtitle: 'Business School', date: 'Completed Nov 05, 2023', accent: 'secondary' },
]

const SCHEDULE = [
  { month: 'JAN', day: '14', title: 'AI Prompt Engineering Workshop', time: '10:00 AM • Live Webinar', badge: 'Live', active: true },
  { month: 'JAN', day: '15', title: 'Python for Data Science Quiz', time: '02:00 PM • Assessment', active: false },
  { month: 'JAN', day: '17', title: 'Mentor Session: Portfolio Review', time: '11:30 AM • 1-on-1 Call', active: false, isLast: true },
]

const RECOMMENDED = [
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwPFOs2sInGaT1LsnE4fbGW2WjbdgFVMTettwHKlQzJPdKzWW5Loa6quJZPGzTdZwgm29QTtz_IKlzc6Tin2MHXBn17AzfczV8tlo8UGrr7NcQ04DGg4yedlgakbaSAR1EgiKC7aQdykuUFwd_i1-7DGgEz02G6g-3KFVrS38W2WqxjHUsGuZcQspNOth123vERN4_XbJVc1piXtAerxs6xoVEFy9Som7gG3XkVmU_SE85cX4DUQHA7MqgPorpmQHb9joBG6_ylfS_',
    title: 'UX Research Crash Course', meta: 'Design • 30 mins', rating: '4.9', enrolled: '1.2k',
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrLB8NeT01qEQphJ8VPs7yg5KWMKtv3EVLruEueWWmFrVI5YZBX0CBiFDES6KnuNzqcXKbUgWorDIM-_jt-krN0ronSC3wHiEa4wTzXeaf-nkaieC59RDhf-KHKiPgIQyKldKwstkMfbrIObAT4L7ips2dRmD_3Cu54Od_CQE2Gf9OvLC60Mw9TetAIcFgep9yvd5KCNgjQ6oQgbKO6LbLhra9z4rOWdnbfK0nmd3ucplw6xwOe7VI-KgaTHDEyO3djN9darFjVOkT',
    title: 'SEO Fundamentals Bootcamp', meta: 'Marketing • 45 mins', rating: '4.7', enrolled: '3.4k',
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrNLjZCjMbncG6Jc65A9nDKiQweAhz-dTVt2fDF8kPVypcmn3YMHicwDYLpKYhzjd4hrfFkRz5ltwBDZ0QMZTKBn85sSFllqRpJMi6r6QijdD0lt6fDqAD0svepLaGC_77JqbAfIzBZ417Jn8TNrYzW1eQdEr_doYcoSZXeay2oZAkJSdDGnWmF-7OFfyEYFKoHy3GMyrSCj_nPdDgDKPt0fSvsMT2Z1MHlctotpwqjPIx5Pl5IS37-IPcqkr1w1f7oaGODdvoFOyL',
    title: 'Freelance Pricing Strategy', meta: 'Career • 20 mins', rating: '4.8', enrolled: '890',
  },
]

const ACTIVITY = [
  { day: 'Mon', active: true },
  { day: 'Tue', active: true },
  { day: 'Wed', active: false },
  { day: 'Thu', active: true },
  { day: 'Fri', active: true },
  { day: 'Sat', active: true },
  { day: 'Sun', active: false },
]

// ── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, isAuthenticated } = useAuth()
  const [updatingProgress, setUpdatingProgress] = useState(false)
  const [claiming, setClaiming] = useState(false)

  // Fetch real progress + certificates for authenticated users
  const { data: progressData, loading: progressLoading } = useApi(getProgress, [], { skip: !isAuthenticated })
  const { data: certsData,    loading: certsLoading }    = useApi(getCertificates, [], { skip: !isAuthenticated })

  // Find active in-progress lesson progress record
  const activeProgress = progressData?.find(p => !p.is_completed)

  // Certificate claim evaluation rules
  const allCompleted = progressData && progressData.length > 0 && progressData.every(p => p.is_completed)
  const hasCertificate = certsData && certsData.some(c => c.learning_path === 1) // path 1
  const canClaim = allCompleted && !hasCertificate

  const handleResumeLearning = async () => {
    if (!activeProgress || updatingProgress) return
    setUpdatingProgress(true)
    try {
      const duration = activeProgress.lesson === 2 ? 420 : 300
      let newWatched = activeProgress.watched_seconds + 100
      if (newWatched >= duration) {
        newWatched = duration
      }
      await trackProgress(activeProgress.lesson, newWatched)
      window.location.reload() // Reload page to fetch updated progress values
    } catch (err) {
      console.error('Error updating progress:', err)
    } finally {
      setUpdatingProgress(false)
    }
  }

  const handleClaimCertificate = async () => {
    if (claiming) return
    setClaiming(true)
    try {
      await claimCertificate(1) // claim for path 1
      window.location.reload()
    } catch (err) {
      console.error('Error claiming certificate:', err)
    } finally {
      setClaiming(false)
    }
  }

  // Derive stats from live progress data
  const completedLessons = progressData?.filter(p => p.is_completed).length || 0
  const totalWatchedSecs = progressData?.reduce((sum, p) => sum + p.watched_seconds, 0) || 0
  const totalWatchedHrs  = (totalWatchedSecs / 3600).toFixed(1)

  const computedStats = [
    { icon: 'schedule',     label: 'Time Learned',   value: progressLoading ? '…' : `${totalWatchedHrs}h`, iconColor: 'text-primary' },
    { icon: 'auto_stories', label: 'Lessons Done',   value: progressLoading ? '…' : String(completedLessons), iconColor: 'text-secondary' },
    { icon: 'fact_check',   label: 'Certificates',   value: certsLoading    ? '…' : String(certsData?.length || 0), iconColor: 'text-on-tertiary-container' },
  ]

  return (
    <div className="flex pt-16 min-h-screen text-on-background">
      <Navbar />
      <Sidebar />

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 md:ml-64 pb-xxl">
        <div className="max-w-5xl mx-auto px-gutter py-xl">

          {/* Welcome + Streak */}
          <section className="mb-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-lg">
            <div>
              <h1 className="font-display text-headline-md text-primary mb-1">
                Welcome back, {user?.username || 'Learner'}! 👋
              </h1>
              <p className="text-body-md text-on-surface-variant">
                Continue where you left off and keep the momentum going.
              </p>
            </div>
            <div className="flex items-center gap-md bg-tertiary-fixed text-on-tertiary-fixed px-lg py-3 rounded-2xl streak-glow border border-tertiary-fixed-dim/30 shrink-0">
              <span className="material-symbols-outlined icon-filled text-on-tertiary-container animate-pulse text-2xl">
                local_fire_department
              </span>
              <div>
                <p className="text-label-md font-semibold leading-none">5-day streak</p>
                <p className="text-[10px] uppercase tracking-wider font-bold opacity-70 mt-0.5">
                  Don't break it!
                </p>
              </div>
            </div>
          </section>

          {/* Claim Certificate Banner */}
          {isAuthenticated && canClaim && (
            <div className="mb-xl p-lg bg-tertiary-container text-on-tertiary-container rounded-2xl border border-tertiary/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md shadow-lg animate-bounce">
              <div>
                <h4 className="font-display text-headline-sm font-bold text-primary mb-1">🎉 Ready to Graduate!</h4>
                <p className="text-body-sm opacity-90">
                  You have completed 100% of the lessons in **AI Tools & Automation**. Claim your official certificate now!
                </p>
              </div>
              <button
                onClick={handleClaimCertificate}
                disabled={claiming}
                className="bg-primary text-on-primary px-xl py-3 rounded-xl text-label-md font-bold hover:opacity-90 transition-opacity shrink-0 shadow-md disabled:opacity-50"
              >
                {claiming ? 'Issuing...' : 'Claim Certificate'}
              </button>
            </div>
          )}

          {/* 8+4 Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">

            {/* ── LEFT COLUMN (8 cols) ── */}
            <div className="lg:col-span-8 space-y-xl">

              {/* Stats Row — driven by live API data */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
                {computedStats.map((s) => (
                  <StatCard key={s.label} {...s} />
                ))}
              </div>

              {/* In Progress */}
              <section>
                <div className="flex justify-between items-center mb-md">
                  <h3 className="font-display text-headline-sm text-primary">In Progress</h3>
                  <a href="#" className="text-secondary text-label-md font-semibold hover:underline">
                    View all
                  </a>
                </div>

                {activeProgress ? (
                  <div className="bg-white rounded-xl overflow-hidden flex flex-col md:flex-row border border-outline-variant/30 card-shadow transition-all duration-300 hover:-translate-y-1 group">
                    {/* Thumbnail */}
                    <div className="md:w-1/3 h-48 md:h-auto overflow-hidden">
                      <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwPFOs2sInGaT1LsnE4fbGW2WjbdgFVMTettwHKlQzJPdKzWW5Loa6quJZPGzTdZwgm29QTtz_IKlzc6Tin2MHXBn17AzfczV8tlo8UGrr7NcQ04DGg4yedlgakbaSAR1EgiKC7aQdykuUFwd_i1-7DGgEz02G6g-3KFVrS38W2WqxjHUsGuZcQspNOth123vERN4_XbJVc1piXtAerxs6xoVEFy9Som7gG3XkVmU_SE85cX4DUQHA7MqgPorpmQHb9joBG6_ylfS_"
                        alt={activeProgress.lesson_title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Details */}
                    <div className="md:w-2/3 p-lg flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-xs mb-2 flex-wrap">
                          <span className="bg-primary-fixed text-on-primary-fixed-variant px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
                            In Progress
                          </span>
                          <span className="text-on-surface-variant text-[12px]">• {activeProgress.watched_seconds}s watched</span>
                        </div>
                        <h4 className="font-display text-headline-sm text-primary mb-md">
                          {activeProgress.lesson_title}
                        </h4>

                        {/* Progress bar */}
                        <div className="space-y-base mb-lg">
                          <div className="flex justify-between text-label-sm text-on-surface-variant">
                            <span>Lesson Progress</span>
                            <span>{Math.min(Math.round((activeProgress.watched_seconds / (activeProgress.lesson === 2 ? 420 : 300)) * 100), 100)}%</span>
                          </div>
                          <div className="w-full bg-surface-container-highest h-3 rounded-full overflow-hidden">
                            <div
                              className="bg-secondary h-full rounded-full transition-all duration-[800ms]"
                              style={{ width: `${Math.min(Math.round((activeProgress.watched_seconds / (activeProgress.lesson === 2 ? 420 : 300)) * 100), 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-md flex-wrap">
                        <button
                          onClick={handleResumeLearning}
                          disabled={updatingProgress}
                          className="bg-secondary text-on-secondary px-lg py-2 rounded-lg text-label-md font-semibold flex items-center gap-xs hover:opacity-90 transition-all disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined">play_arrow</span>
                          {updatingProgress ? 'Simulating Play...' : 'Watch +100s'}
                        </button>
                        <Link
                          to={`/lesson/${activeProgress.lesson}`}
                          className="bg-primary-fixed text-on-primary-fixed-variant px-lg py-2 rounded-lg text-label-md font-semibold hover:bg-primary-fixed-dim transition-all flex items-center justify-center"
                        >
                          View Lesson Content
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-xl border border-outline-variant/30 card-shadow text-center w-full">
                    <p className="text-on-surface-variant text-body-md mb-2">
                      {isAuthenticated 
                        ? "🎉 All registered lessons completed! No lessons in progress." 
                        : "Please Sign In to track and resume your learning progress."}
                    </p>
                  </div>
                )}
              </section>

              {/* Earned Certificates — real API data */}
              <section>
                <div className="flex justify-between items-center mb-md">
                  <h3 className="font-display text-headline-sm text-primary">Earned Certificates</h3>
                  <button className="text-on-surface-variant text-label-md font-semibold flex items-center gap-xs hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-sm">filter_list</span>
                    Filter
                  </button>
                </div>

                {/* Loading skeleton */}
                {certsLoading && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
                    {[1,2].map(n => (
                      <div key={n} className="bg-surface-container rounded-xl aspect-[4/3] animate-pulse" />
                    ))}
                  </div>
                )}

                {/* Real certificates from API */}
                {!certsLoading && certsData && certsData.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
                    {certsData.map((cert, i) => (
                      <CertificateCard
                        key={cert.certificate_uuid}
                        uuid={cert.certificate_uuid}
                        title={cert.learning_path_title}
                        subtitle={cert.username || user?.username || 'Learner'}
                        date={`Issued ${new Date(cert.issued_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}`}
                        accent={i % 2 === 0 ? 'primary' : 'secondary'}
                      />
                    ))}
                  </div>
                )}


                {/* Fallback: no certs yet (or not authenticated) */}
                {!certsLoading && (!certsData || certsData.length === 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
                    {CERTIFICATES.map((cert) => (
                      <CertificateCard key={cert.title} {...cert} />
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* ── RIGHT COLUMN (4 cols) ── */}
            <div className="lg:col-span-4 space-y-lg">

              {/* Schedule */}
              <div className="bg-white p-lg rounded-xl border border-outline-variant/30 card-shadow">
                <div className="flex justify-between items-center mb-lg">
                  <h3 className="font-display text-headline-sm text-primary">Schedule</h3>
                  <button
                    className="text-on-surface-variant p-1 hover:text-primary transition-colors"
                    aria-label="More options"
                  >
                    <span className="material-symbols-outlined">more_horiz</span>
                  </button>
                </div>
                <div className="space-y-md">
                  {SCHEDULE.map((item) => (
                    <ScheduleItem key={item.title} {...item} />
                  ))}
                </div>
              </div>

              {/* Recommended */}
              <div className="bg-white p-lg rounded-xl border border-outline-variant/30 card-shadow">
                <div className="flex justify-between items-center mb-lg">
                  <h3 className="font-display text-headline-sm text-primary">Recommended</h3>
                  <a href="#" className="text-secondary text-label-md font-semibold hover:underline">
                    See all
                  </a>
                </div>
                <div className="space-y-md">
                  {RECOMMENDED.map((r) => (
                    <div
                      key={r.title}
                      className="flex gap-md group cursor-pointer p-sm rounded-lg -mx-sm hover:bg-surface-container-low transition-colors"
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                        <img
                          src={r.image}
                          alt={r.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-label-md font-semibold text-primary group-hover:text-secondary transition-colors truncate">
                          {r.title}
                        </p>
                        <p className="text-label-sm text-on-surface-variant">{r.meta}</p>
                        <div className="flex items-center gap-xs mt-1">
                          <span className="material-symbols-outlined icon-filled text-on-tertiary-container text-sm">
                            star
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            {r.rating} • {r.enrolled} enrolled
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Activity Heatmap */}
              <div className="bg-white p-lg rounded-xl border border-outline-variant/30 card-shadow">
                <h3 className="font-display text-headline-sm text-primary mb-lg">
                  This Week's Activity
                </h3>
                <div className="flex gap-sm justify-between">
                  {ACTIVITY.map(({ day, active }) => (
                    <div key={day} className="flex flex-col items-center gap-xs">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${
                          active
                            ? 'bg-secondary'
                            : 'bg-surface-container-high'
                        }`}
                        title={`${day} — ${active ? 'Active' : 'No activity'}`}
                      >
                        {active && (
                          <span className="material-symbols-outlined icon-filled text-on-secondary text-sm">
                            check
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-on-surface-variant">{day}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-md text-label-sm text-on-surface-variant">
                  5 of 7 days active • Keep it up!
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
