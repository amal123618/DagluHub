import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import CourseCard from '../components/CourseCard'
import useApi from '../hooks/useApi'
import { getLearningPaths } from '../api/courses'

// ── Data ────────────────────────────────────────────────────────────────────
const AVATARS = [
  {
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaH9O0ms75Zstzqlri23V3PrfWX5JoOy_SODnlvP_5PXzTwMVJRWBljWk0wGu6wdqBTgG78xD79oSHeZv3BmUMeyWgklatvQ5Q6tf8bE1z-hX6eKX1qXIpbSZ1APDHl-yBJFL2zHxIx4oXcGLmy_7YTwh0lNcFu0G6SsnEYqoXe_byYJCEnKUMC3OvvlM1dDL3Bs8ZXYruJ-1OGzPorTMz6-4PDS8UQkhO5q9k40dDGVsT9a8FqpyewQ9nsJZ6wjPSqqJlN98Htneh',
    alt: 'Learner 1',
  },
  {
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3x6jgU0WtUpF3VL9fVKqSf4Z-o5wrCRMyxi_SGuYRTWEg6N1pMMjQ9CZeYfANr1Qcc2BZ1rMOuYi_pkI4_VpPMFobdD0gd4SJjc8tIt5-Qa-EiPon85Z0OaHDqyAvF3iUDJVpXEP7x8B86z8AIf4pr6MsfsCEJrjm0HuASMiDMuz34OZRN8KGNpYvTtu_VgYDmqeCIfbAA2F8cjzS74A-ehGHjN5pPFcrGG468vnd3N9jtmiYdnTClzQfaih5p0y4qZYgQ_-pHt3f',
    alt: 'Learner 2',
  },
  {
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-8iWPkdbRw9WKCC2YeUOZ8vKP_mpFi9V9fzr0NcKf_qO01MvHo-0ZUNYgHmFw2RCNgKsePlwQXB-lialh5LZKHUdsj2BvJMbfJPlQDx3BpZHw23OAbssysUcQuThXQqx7nXX03pLYbpp3gcbZQxwwEqRYPVQqW2dLB9brtB1dZOLFZOzyWuk7VBSz1BAFIaXzqzldxwh3vKwucYe_23R7DsQy4IfJDg634x67tZMn1W8HP9sg7bY_pcQYOn6Z97QsJ_MPv8ZHKEc6',
    alt: 'Learner 3',
  },
]

const CATEGORIES = [
  'All Topics', 'Artificial Intelligence', 'Digital Marketing',
  'Freelancing', 'Productivity', 'UX Design', 'Data Science', 'Business Strategy',
]

// Fallback cards shown when the DB is empty or the API is loading
const PLACEHOLDER_COURSES = [
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwPFOs2sInGaT1LsnE4fbGW2WjbdgFVMTettwHKlQzJPdKzWW5Loa6quJZPGzTdZwgm29QTtz_IKlzc6Tin2MHXBn17AzfczV8tlo8UGrr7NcQ04DGg4yedlgakbaSAR1EgiKC7aQdykuUFwd_i1-7DGgEz02G6g-3KFVrS38W2WqxjHUsGuZcQspNOth123vERN4_XbJVc1piXtAerxs6xoVEFy9Som7gG3XkVmU_SE85cX4DUQHA7MqgPorpmQHb9joBG6_ylfS_',
    duration: '45 mins', tag: 'AI & TECH',
    title: 'Mastering AI Tools',
    description: 'Learn to leverage Midjourney, ChatGPT, and Notion AI to 10x your creative output and efficiency.',
    enrolled: '2.4k Enrolled',
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrLB8NeT01qEQphJ8VPs7yg5KWMKtv3EVLruEueWWmFrVI5YZBX0CBiFDES6KnuNzqcXKbUgWorDIM-_jt-krN0ronSC3wHiEa4wTzXeaf-nkaieC59RDhf-KHKiPgIQyKldKwstkMfbrIObAT4L7ips2dRmD_3Cu54Od_CQE2Gf9OvLC60Mw9TetAIcFgep9yvd5KCNgjQ6oQgbKO6LbLhra9z4rOWdnbfK0nmd3ucplw6xwOe7VI-KgaTHDEyO3djN9darFjVOkT',
    duration: '60 mins', tag: 'MARKETING',
    title: 'Digital Marketing 101',
    description: 'From SEO basics to conversion optimization. Everything you need to grow your brand online.',
    enrolled: '1.8k Enrolled',
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrNLjZCjMbncG6Jc65A9nDKiQweAhz-dTVt2fDF8kPVypcmn3YMHicwDYLpKYhzjd4hrfFkRz5ltwBDZ0QMZTKBn85sSFllqRpJMi6r6QijdD0lt6fDqAD0svepLaGC_77JqbAfIzBZ417Jn8TNrYzW1eQdEr_doYcoSZXeay2oZAkJSdDGnWmF-7OFfyEYFKoHy3GMyrSCj_nPdDgDKPt0fSvsMT2Z1MHlctotpwqjPIx5Pl5IS37-IPcqkr1w1f7oaGODdvoFOyL',
    duration: '35 mins', tag: 'CAREER',
    title: 'Freelancing Blueprint',
    description: 'The ultimate guide to landing your first $1k client and managing your solo business effectively.',
    enrolled: '3.1k Enrolled',
  },
]

const STATS = [
  { value: '12K+', label: 'Active Learners' },
  { value: '500+', label: 'Micro-Courses' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: 'Free', label: 'To Get Started' },
]

const FOOTER_LINKS = {
  Platform: ['Browse Courses', 'Learning Paths', 'Certifications'],
  Company: ['About Us', 'Blog', 'Careers'],
  Support: ['Help Center', 'Contact Us', 'Privacy Policy'],
}

// ── Skeleton loader for course cards ─────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-surface rounded-xl overflow-hidden card-shadow flex flex-col animate-pulse">
      <div className="h-48 bg-surface-container-high" />
      <div className="p-lg flex flex-col gap-sm flex-grow">
        <div className="h-5 bg-surface-container-high rounded w-3/4" />
        <div className="h-4 bg-surface-container-high rounded w-full" />
        <div className="h-4 bg-surface-container-high rounded w-2/3" />
        <div className="mt-auto pt-lg border-t border-outline-variant flex justify-between">
          <div className="h-4 bg-surface-container-high rounded w-24" />
          <div className="h-10 bg-surface-container-high rounded w-28" />
        </div>
      </div>
    </div>
  )
}

// ── Map API learning path → CourseCard props ──────────────────────────────────
function pathToCardProps(path) {
  const firstCourse = path.courses?.[0]
  const lessonCount = path.courses?.reduce((sum, c) => sum + (c.lessons?.length || 0), 0) || 0
  const totalMins   = Math.round(lessonCount * 5) // each lesson ~5 min average
  return {
    pathId:      path.id,
    image:       firstCourse?.thumbnail || PLACEHOLDER_COURSES[0].image,
    duration:    totalMins ? `${totalMins} mins` : '—',
    tag:         path.difficulty_level?.toUpperCase() || 'COURSE',
    title:       path.title,
    description: path.description,
    enrolled:    `${path.courses?.length || 0} course${path.courses?.length !== 1 ? 's' : ''}`,
  }
}


// ── Component ────────────────────────────────────────────────────────────────
export default function Home() {
  const [activeCategory, setActiveCategory] = useState('All Topics')
  const { data: learningPaths, loading: pathsLoading, error: pathsError } = useApi(getLearningPaths, [])

  return (
    <div className="text-on-background">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-xxl bg-surface overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-fixed/20 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary-container/30 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-container-max mx-auto px-gutter relative z-10 flex flex-col md:flex-row items-center gap-xxl">
          {/* Left copy */}
          <div className="flex-1 text-left">
            <div className="inline-flex items-center gap-xs bg-secondary-container text-on-secondary-container px-md py-2 rounded-full text-label-sm font-semibold mb-md">
              <span className="material-symbols-outlined icon-filled text-sm">bolt</span>
              12,000+ learners joined this week
            </div>

            <h1 className="font-display text-display-lg text-primary mb-md leading-tight">
              Master practical<br />skills. 5 minutes<br />at a time.
            </h1>
            <p className="text-body-lg text-on-surface-variant mb-xl max-w-lg">
              Level up your career with micro-learning modules designed by industry
              experts. Short, impactful, and entirely free to start.
            </p>

            <div className="flex flex-wrap gap-md mb-xl">
              <a
                href="#featured-paths"
                className="h-12 px-xl bg-secondary text-on-secondary rounded-lg text-label-md font-semibold hover:opacity-90 transition-all shadow-md flex items-center gap-xs"
              >
                <span className="material-symbols-outlined text-sm">explore</span>
                Explore Free Micro-Courses
              </a>
              <button className="h-12 px-xl bg-primary-fixed text-primary rounded-lg text-label-md font-semibold hover:bg-primary-fixed-dim transition-all flex items-center gap-xs">
                <span className="material-symbols-outlined text-sm">route</span>
                View Learning Paths
              </button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-md text-label-sm text-on-surface-variant">
              <div className="flex -space-x-2">
                {AVATARS.map((a) => (
                  <img
                    key={a.alt}
                    src={a.src}
                    alt={a.alt}
                    className="w-8 h-8 rounded-full border-2 border-surface object-cover"
                  />
                ))}
              </div>
              <span>
                Joined by <strong className="text-primary">12,000+</strong> active learners this week
              </span>
            </div>
          </div>

          {/* Right: Hero media card */}
          <div className="flex-1 w-full max-w-xl">
            <div className="relative rounded-xl overflow-hidden shadow-2xl aspect-video group">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCERpSGo0ABXGfzWUrOqnt2lRxalejUIiB1IAU_3tYHhJrqD7KuPiyfW2GiNDOLb0MvtrJr5l6x7nYGURd1hfS4Hca2HXsVxMXSDSMZzssWEnRR8OnNlTBe5mr3MgxOyJXvgu2Xmm_VsY6_jBiS7FKT7QJgT44H2a23ZodPleJtV69qqOA0soWL5X5hhNVKWg-q2GvmxMhWqcyYGwEdXuqjHt14FwGpVinSYOa72mSIrMasGixt97Xn-qvvDN5XZzQGRKkyV3a6BKBE"
                alt="Learning dashboard preview"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent" />

              {/* Floating next lesson pill */}
              <div className="absolute bottom-md left-md right-md bg-surface/90 backdrop-blur-sm p-md rounded-lg flex items-center justify-between border border-outline-variant/30 shadow-lg">
                <div>
                  <p className="text-label-md font-semibold text-primary">
                    Next Lesson: Intro to AI Prompting
                  </p>
                  <p className="text-label-sm text-on-surface-variant">2 mins remaining</p>
                </div>
                <span className="material-symbols-outlined icon-filled text-secondary text-4xl">
                  play_circle
                </span>
              </div>
            </div>

            {/* Floating stats badges */}
            <div className="flex gap-md mt-md">
              {[
                { bg: 'bg-secondary-container', icon: 'school', iconClass: 'text-on-secondary-container', label: 'Courses', value: '500+' },
                { bg: 'bg-primary-fixed', icon: 'verified', iconClass: 'text-primary', label: 'Certificates', value: 'Industry-Ready' },
                { bg: 'bg-tertiary-fixed', icon: 'bolt', iconClass: 'text-on-tertiary-container', label: 'Avg. Lesson', value: '5 mins' },
              ].map(({ bg, icon, iconClass, label, value }) => (
                <div key={label} className="flex-1 bg-surface rounded-xl p-md border border-outline-variant/30 flex items-center gap-sm shadow-sm">
                  <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
                    <span className={`material-symbols-outlined icon-filled text-sm ${iconClass}`}>{icon}</span>
                  </div>
                  <div>
                    <p className="text-label-sm text-on-surface-variant">{label}</p>
                    <p className="text-label-md font-semibold text-primary">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORY FILTERS ── */}
      <section className="py-xl bg-surface-container-low border-y border-outline-variant sticky top-16 z-40 shadow-sm">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="flex items-center gap-md overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-label-md font-semibold text-primary shrink-0 mr-md">
              Popular categories:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-md py-2 rounded-full text-label-sm font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-surface text-on-surface-variant border border-outline-variant hover:bg-surface-container-high'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED LEARNING PATHS ── */}
      <section id="featured-paths" className="py-xxl max-w-container-max mx-auto px-gutter">
        <div className="flex justify-between items-end mb-xl">
          <div>
            <h2 className="font-display text-headline-md text-primary mb-xs">
              Featured Learning Paths
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Structured paths to help you master complex topics fast.
            </p>
          </div>
          <a href="#" className="text-primary text-label-md font-semibold flex items-center gap-xs hover:underline">
            View all paths
            <span className="material-symbols-outlined">arrow_forward</span>
          </a>
        </div>

        {/* Error state */}
        {pathsError && (
          <div className="mb-lg p-md bg-error-container text-on-error-container rounded-lg text-body-sm flex items-center gap-sm">
            <span className="material-symbols-outlined text-sm">warning</span>
            Could not load courses from the server. Showing sample data.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {/* Loading skeletons */}
          {pathsLoading && [1, 2, 3].map((n) => <CardSkeleton key={n} />)}

          {/* Real data from API */}
          {!pathsLoading && learningPaths && learningPaths.length > 0 &&
            learningPaths.slice(0, 6).map((path) => (
              <CourseCard key={path.id} {...pathToCardProps(path)} />
            ))
          }

          {/* Fallback: API returned empty list or failed */}
          {!pathsLoading && (!learningPaths || learningPaths.length === 0) &&
            PLACEHOLDER_COURSES.map((c) => <CourseCard key={c.title} {...c} />)
          }
        </div>
      </section>

      {/* ── BENTO GRID ── */}
      <section className="py-xxl bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="text-center mb-xl">
            <h2 className="font-display text-headline-md text-primary mb-sm">
              Built for Modern Learners
            </h2>
            <p className="text-body-md text-on-surface-variant max-w-lg mx-auto">
              Everything you need to build real skills, fast — designed around your schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-md" style={{ minHeight: '480px' }}>
            {/* Tall: Micro-learning */}
            <div className="md:col-span-2 md:row-span-2 bg-surface p-xl rounded-xl border border-outline-variant flex flex-col justify-end relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed/40 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-xl right-xl opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '120px' }}>bolt</span>
              </div>
              <div className="relative z-10">
                <span className="material-symbols-outlined icon-filled text-primary text-4xl mb-md block">bolt</span>
                <h4 className="font-display text-headline-sm text-primary mb-sm">Micro-learning focus</h4>
                <p className="text-body-md text-on-surface-variant">
                  Lessons are distilled into 5-minute segments, perfect for commuting or lunch breaks. No overwhelm — just progress.
                </p>
              </div>
            </div>

            {/* Certifications */}
            <div className="md:col-span-2 bg-primary p-lg rounded-xl flex items-center gap-lg text-on-primary">
              <div className="bg-white/20 p-md rounded-lg shrink-0">
                <span className="material-symbols-outlined icon-filled text-3xl">verified</span>
              </div>
              <div>
                <h4 className="text-label-md font-semibold mb-xs">Industry Certifications</h4>
                <p className="text-label-sm opacity-80">
                  Earn shareable certificates recognized by leading tech companies and design studios worldwide.
                </p>
              </div>
            </div>

            {/* Community Mentors */}
            <div className="md:col-span-1 bg-secondary-container p-lg rounded-xl flex flex-col justify-between">
              <span className="material-symbols-outlined icon-filled text-on-secondary-container text-3xl mb-sm">groups</span>
              <div>
                <h4 className="text-label-md font-semibold text-on-secondary-container mb-1">Community Mentors</h4>
                <p className="text-label-sm text-on-secondary-container opacity-80">
                  Learn alongside peers. Get 1-on-1 guidance from experts.
                </p>
              </div>
            </div>

            {/* Daily Updates */}
            <div className="md:col-span-1 bg-surface p-lg rounded-xl border border-outline-variant flex flex-col justify-between">
              <span className="material-symbols-outlined icon-filled text-primary text-3xl mb-sm">update</span>
              <div>
                <h4 className="text-label-md font-semibold text-primary mb-1">Daily Updates</h4>
                <p className="text-label-sm text-on-surface-variant">
                  Fresh content added every day, curated by domain experts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="py-xl border-y border-outline-variant bg-surface">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-lg text-center">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="font-display text-headline-md text-primary font-bold">{value}</p>
                <p className="text-label-sm text-on-surface-variant">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="w-full py-xxl bg-surface-container-lowest border-t border-outline-variant">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="flex flex-col md:flex-row justify-between items-start gap-xl mb-xl">
            <div className="flex flex-col gap-sm max-w-xs">
              <span className="font-display text-headline-sm font-bold text-on-surface">DAGLUHUB</span>
              <p className="text-body-sm text-on-surface-variant">
                Empowering modern learners with bite-sized, practical skills that actually move the needle in your career.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-xl">
              {Object.entries(FOOTER_LINKS).map(([group, links]) => (
                <div key={group}>
                  <p className="text-label-md font-semibold text-on-surface mb-md">{group}</p>
                  <ul className="space-y-sm">
                    {links.map((l) => (
                      <li key={l}>
                        <a href="#" className="text-body-sm text-on-surface-variant hover:text-primary transition-colors">
                          {l}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-md pt-xl border-t border-outline-variant">
            <p className="text-body-sm text-on-surface-variant">
              © 2024 DAGLUHUB Microlearning. All rights reserved.
            </p>
            <div className="flex gap-md">
              {['share', 'language'].map((icon) => (
                <button
                  key={icon}
                  className="w-10 h-10 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center hover:bg-surface-container-high transition-colors"
                  aria-label={icon}
                >
                  <span className="material-symbols-outlined text-on-surface-variant">{icon}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
