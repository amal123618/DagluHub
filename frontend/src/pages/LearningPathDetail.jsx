import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import Navbar from '../components/Navbar'
import useApi from '../hooks/useApi'
import { getLearningPaths } from '../api/courses'
import { getProgress, getCertificates, claimCertificate } from '../api/user'
import { useAuth } from '../context/AuthContext'

export default function LearningPathDetail() {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState('')

  // 1. Fetch data
  const { data: paths, loading: pathsLoading, error: pathsError } = useApi(getLearningPaths, [])
  const { data: progress, refetch: refetchProgress } = useApi(getProgress, [], { skip: !isAuthenticated })
  const { data: certs, refetch: refetchCerts } = useApi(getCertificates, [], { skip: !isAuthenticated })

  // Find target path
  const path = paths?.find(p => p.id === parseInt(id))

  // 2. Compute progress & actions
  const lessons = path ? path.courses.flatMap(c => c.lessons) : []
  const totalLessons = lessons.length

  const completedLessonIds = progress
    ? new Set(progress.filter(p => p.is_completed).map(p => p.lesson))
    : new Set()

  const completedCount = lessons.filter(l => completedLessonIds.has(l.id)).length
  const isFinished = totalLessons > 0 && completedCount === totalLessons

  // Check if certificate already exists
  const existingCert = certs?.find(c => c.learning_path === parseInt(id))

  const handleClaim = async () => {
    if (claiming) return
    setClaiming(true)
    setClaimError('')
    try {
      await claimCertificate(id)
      await refetchCerts()
    } catch (err) {
      setClaimError(err.message || 'Could not claim certificate. Please try again.')
    } finally {
      setClaiming(false)
    }
  }

  if (pathsLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (pathsError || !path) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center p-xl text-center">
          <span className="material-symbols-outlined text-error text-6xl mb-md">warning</span>
          <h2 className="font-display text-headline-md text-primary mb-sm">Learning Path Not Found</h2>
          <p className="text-body-md text-on-surface-variant mb-lg">
            The learning path you are trying to view does not exist or could not be loaded.
          </p>
          <Link to="/" className="h-10 px-lg bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:opacity-90 transition-opacity flex items-center justify-center">
            Go back Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-on-background bg-[#f8f9fa] pt-24 pb-xxl">
      <Navbar />

      <div className="max-w-5xl mx-auto px-gutter">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-xs text-label-sm text-on-surface-variant mb-lg">
          <Link to="/" className="hover:text-primary transition-colors">Browse</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-primary font-semibold">Learning Path Details</span>
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white border border-outline-variant/30 rounded-2xl p-xl shadow-lg mb-xl flex flex-col md:flex-row justify-between gap-xl">
          {/* Background gradient */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-fixed/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex-1 space-y-md relative z-10">
            <span className="inline-block bg-secondary-container text-on-secondary-container px-md py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
              {path.difficulty_level}
            </span>
            <h1 className="font-display text-display-sm text-primary leading-tight font-bold">
              {path.title}
            </h1>
            <p className="text-body-md text-on-surface-variant max-w-2xl">
              {path.description}
            </p>

            {isAuthenticated && (
              <div className="flex items-center gap-lg pt-base border-t border-outline-variant/20">
                <div className="space-y-xs flex-grow max-w-sm">
                  <div className="flex justify-between text-label-sm">
                    <span className="text-on-surface-variant font-semibold">Path Progress</span>
                    <span className="text-primary font-bold">{Math.round((completedCount / (totalLessons || 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-secondary h-full rounded-full transition-all duration-700"
                      style={{ width: `${(completedCount / (totalLessons || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-label-sm text-on-surface-variant shrink-0">
                  <strong>{completedCount}</strong> of <strong>{totalLessons}</strong> lessons complete
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center items-stretch md:items-end gap-md shrink-0 relative z-10 w-full md:w-auto">
            {existingCert ? (
              <Link
                to={`/certificate/${existingCert.certificate_uuid}`}
                className="h-12 px-xl bg-tertiary-container text-on-tertiary-container rounded-xl text-label-md font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-sm shadow-md"
              >
                <span className="material-symbols-outlined icon-filled">verified</span>
                View Certificate
              </Link>
            ) : isFinished ? (
              <div className="space-y-sm">
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="w-full h-12 px-xl bg-secondary text-on-secondary rounded-xl text-label-md font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-sm shadow-md disabled:opacity-50"
                >
                  <span className="material-symbols-outlined icon-filled text-sm">verified</span>
                  {claiming ? 'Generating...' : 'Claim Certificate'}
                </button>
                {claimError && <p className="text-error text-label-sm text-center font-semibold">{claimError}</p>}
              </div>
            ) : (
              <Link
                to={lessons.length > 0 ? `/lesson/${lessons[0].id}` : '#'}
                className="h-12 px-xl bg-primary text-on-primary rounded-xl text-label-md font-bold hover:opacity-95 transition-opacity flex items-center justify-center gap-sm shadow-md"
              >
                <span className="material-symbols-outlined text-sm">play_circle</span>
                Start Learning
              </Link>
            )}

            <div className="text-center md:text-right text-label-sm text-on-surface-variant">
              Includes {path.courses.length} courses • {totalLessons} lessons
            </div>
          </div>
        </section>

        {/* Outline Grid */}
        <div className="space-y-lg">
          <h2 className="font-display text-headline-sm text-primary font-bold">Path Outline</h2>

          {path.courses.map((course, idx) => (
            <div key={course.id} className="bg-white border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-lg bg-surface-container-low/50 border-b border-outline-variant/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
                <div>
                  <span className="text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">
                    Course {idx + 1}
                  </span>
                  <h3 className="font-display text-headline-sm text-primary font-bold mt-1">
                    {course.title}
                  </h3>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    {course.description}
                  </p>
                </div>
                <div className="text-label-sm text-on-surface-variant font-medium shrink-0">
                  Taught by <strong className="text-secondary">{course.instructor_name || 'Expert'}</strong>
                </div>
              </div>

              {/* Lessons Outline List */}
              <div className="divide-y divide-outline-variant/10">
                {course.lessons.map((lesson) => {
                  const isCompleted = completedLessonIds.has(lesson.id)
                  const minutes = Math.round(lesson.duration_seconds / 60)

                  return (
                    <div
                      key={lesson.id}
                      className="p-md flex items-center justify-between hover:bg-surface-container-lowest transition-colors gap-md group"
                    >
                      <div className="flex items-center gap-md min-w-0">
                        {isCompleted ? (
                          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined icon-filled text-secondary text-sm">
                              check
                            </span>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant text-label-md font-bold flex items-center justify-center shrink-0">
                            {lesson.sort_order}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-label-md font-semibold text-primary group-hover:text-secondary transition-colors truncate">
                            {lesson.title}
                          </p>
                          <p className="text-label-sm text-on-surface-variant mt-0.5">
                            {minutes} mins • Bite-sized module
                          </p>
                        </div>
                      </div>

                      <Link
                        to={`/lesson/${lesson.id}`}
                        className={`h-9 px-md rounded-lg text-label-sm font-bold flex items-center gap-xs transition-all ${
                          isCompleted
                            ? 'border border-outline text-on-surface-variant hover:text-primary hover:border-primary'
                            : 'bg-primary text-on-primary hover:opacity-90 shadow-sm'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {isCompleted ? 'replay' : 'play_arrow'}
                        </span>
                        {isCompleted ? 'Review' : 'Start'}
                      </Link>
                    </div>
                  )
                })}

                {course.lessons.length === 0 && (
                  <p className="p-lg text-center text-body-sm text-on-surface-variant italic">
                    No lessons configured yet for this course.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
