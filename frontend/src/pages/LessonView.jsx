import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import useApi from '../hooks/useApi'
import { getLesson, getCourse } from '../api/courses'
import { getProgress, trackProgress } from '../api/user'
import { useAuth } from '../context/AuthContext'

export default function LessonView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const videoRef = useRef(null)
  const lastUpdatedTimeRef = useRef(0)

  // 1. Fetch data
  const { data: lesson, loading: lessonLoading, error: lessonError } = useApi(() => getLesson(id), [id])
  const { data: course, loading: courseLoading } = useApi(() => getCourse(lesson.course), [lesson?.course], { skip: !lesson })
  const { data: progressList, refetch: refetchProgress } = useApi(getProgress, [], { skip: !isAuthenticated })

  const currentProgress = progressList?.find(p => p.lesson === parseInt(id))
  const isCompleted = currentProgress?.is_completed || false
  const initialWatched = currentProgress?.watched_seconds || 0

  const [simulating, setSimulating] = useState(false)

  // Sync video current time to initial watched seconds once loaded
  useEffect(() => {
    if (videoRef.current && initialWatched > 0) {
      videoRef.current.currentTime = initialWatched
      lastUpdatedTimeRef.current = initialWatched
    }
  }, [initialWatched, id])

  // Track progress on the backend
  const updateProgress = async (seconds) => {
    if (!isAuthenticated || !lesson) return
    try {
      await trackProgress(lesson.id, Math.round(seconds))
      refetchProgress()
    } catch (err) {
      console.error('Failed to sync progress:', err)
    }
  }

  // Handle HTML5 video events
  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const currentTime = videoRef.current.currentTime
    // Sync to backend every 10 seconds of watch progress to prevent spamming
    if (Math.abs(currentTime - lastUpdatedTimeRef.current) >= 10) {
      lastUpdatedTimeRef.current = currentTime
      updateProgress(currentTime)
    }
  }

  const handlePause = () => {
    if (!videoRef.current) return
    updateProgress(videoRef.current.currentTime)
  }

  // Simulate progress (+60s watch time)
  const handleSimulateProgress = async () => {
    if (simulating || !lesson) return
    setSimulating(true)
    try {
      const nextWatched = Math.min((currentProgress?.watched_seconds || 0) + 60, lesson.duration_seconds)
      if (videoRef.current) {
        videoRef.current.currentTime = nextWatched
        lastUpdatedTimeRef.current = nextWatched
      }
      await trackProgress(lesson.id, nextWatched)
      refetchProgress()
    } catch (err) {
      console.error('Simulation failed:', err)
    } finally {
      setSimulating(false)
    }
  }

  // Complete lesson directly
  const handleCompleteDirectly = async () => {
    if (simulating || !lesson) return
    setSimulating(true)
    try {
      if (videoRef.current) {
        videoRef.current.currentTime = lesson.duration_seconds
        lastUpdatedTimeRef.current = lesson.duration_seconds
      }
      await trackProgress(lesson.id, lesson.duration_seconds)
      refetchProgress()
    } catch (err) {
      console.error('Completion failed:', err)
    } finally {
      setSimulating(false)
    }
  }

  if (lessonLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (lessonError || !lesson) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center p-xl text-center">
          <span className="material-symbols-outlined text-error text-6xl mb-md">warning</span>
          <h2 className="font-display text-headline-md text-primary mb-sm">Lesson Not Found</h2>
          <p className="text-body-md text-on-surface-variant mb-lg">
            This lesson is unavailable or you need to log in to access it.
          </p>
          <Link to="/" className="h-10 px-lg bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:opacity-90 transition-opacity flex items-center justify-center">
            Browse Courses
          </Link>
        </div>
      </div>
    )
  }

  // Find next lesson in the course outline
  const currentIdx = course?.lessons?.findIndex(l => l.id === lesson.id) ?? -1
  const nextLesson = course?.lessons && currentIdx !== -1 && currentIdx < course.lessons.length - 1
    ? course.lessons[currentIdx + 1]
    : null

  return (
    <div className="min-h-screen text-on-background bg-[#f8f9fa] pt-16 flex flex-col md:flex-row">
      <Navbar />

      {/* Sidebar Course Outline */}
      <aside className="w-full md:w-80 bg-white border-r border-outline-variant/30 flex flex-col shrink-0 md:h-[calc(100vh-64px)] md:sticky md:top-16 overflow-y-auto">
        <div className="p-lg border-b border-outline-variant/20">
          <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Course Outline</span>
          <h3 className="font-display text-headline-sm text-primary font-bold mt-1">
            {courseLoading ? 'Loading Course...' : course?.title}
          </h3>
        </div>
        <div className="divide-y divide-outline-variant/10 flex-grow">
          {course?.lessons?.map((outlineLesson, idx) => {
            const isOutlineCompleted = progressList?.find(p => p.lesson === outlineLesson.id)?.is_completed
            const isActive = outlineLesson.id === lesson.id
            return (
              <Link
                key={outlineLesson.id}
                to={`/lesson/${outlineLesson.id}`}
                className={`p-md flex items-start gap-sm transition-colors hover:bg-surface-container-lowest ${
                  isActive ? 'bg-primary-fixed/20 border-l-4 border-primary' : ''
                }`}
              >
                {isOutlineCompleted ? (
                  <span className="material-symbols-outlined icon-filled text-secondary text-sm mt-0.5 shrink-0">check_circle</span>
                ) : (
                  <span className="text-label-sm text-on-surface-variant font-bold mt-0.5 shrink-0">{idx + 1}.</span>
                )}
                <div className="min-w-0">
                  <p className={`text-label-sm font-semibold truncate ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                    {outlineLesson.title}
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    {Math.round(outlineLesson.duration_seconds / 60)} mins
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-lg md:p-xl overflow-y-auto h-[calc(100vh-64px)]">
        <div className="max-w-4xl mx-auto space-y-xl">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-xs text-label-sm text-on-surface-variant">
            <Link to="/" className="hover:text-primary transition-colors">Browse</Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            {course && (
              <>
                <Link to={`/learning-path/${course.learning_path}`} className="hover:text-primary transition-colors truncate max-w-[120px]">
                  Learning Path
                </Link>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </>
            )}
            <span className="text-primary font-semibold truncate">{lesson.title}</span>
          </div>

          {/* Video Player Box */}
          <section className="bg-black aspect-video rounded-2xl overflow-hidden shadow-xl border border-black relative group">
            {lesson.video_url ? (
              <video
                ref={videoRef}
                src={lesson.video_url}
                controls
                className="w-full h-full"
                onTimeUpdate={handleTimeUpdate}
                onPause={handlePause}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white bg-slate-900 gap-md">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant">video_library</span>
                <p className="text-body-md">No video file associated with this lesson.</p>
              </div>
            )}
          </section>

          {/* Controls / Simulation Strip */}
          {isAuthenticated && (
            <section className="bg-surface-container-low p-md rounded-2xl border border-outline-variant/30 flex flex-wrap justify-between items-center gap-md">
              <div className="flex items-center gap-sm">
                {isCompleted ? (
                  <div className="flex items-center gap-1.5 text-secondary font-bold text-label-sm">
                    <span className="material-symbols-outlined icon-filled text-sm">check_circle</span>
                    Lesson Completed!
                  </div>
                ) : (
                  <div className="text-label-sm text-on-surface-variant font-medium">
                    Watched: <strong className="text-primary">{Math.round(currentProgress?.watched_seconds || 0)}s</strong> / {lesson.duration_seconds}s
                    ({Math.min(Math.round(((currentProgress?.watched_seconds || 0) / lesson.duration_seconds) * 100), 100)}%)
                  </div>
                )}
              </div>
              <div className="flex items-center gap-sm flex-wrap">
                <button
                  onClick={handleSimulateProgress}
                  disabled={simulating || isCompleted}
                  className="h-9 px-md bg-secondary text-on-secondary rounded-lg text-label-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">fast_forward</span>
                  +60s Watch Time
                </button>
                <button
                  onClick={handleCompleteDirectly}
                  disabled={simulating || isCompleted}
                  className="h-9 px-md bg-primary text-on-primary rounded-lg text-label-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">done_all</span>
                  Skip to End (Complete)
                </button>
              </div>
            </section>
          )}

          {/* Lesson Metadata + Body */}
          <section className="bg-white border border-outline-variant/30 rounded-2xl p-xl shadow-sm space-y-lg">
            <div>
              <h1 className="font-display text-display-xs text-primary font-bold">
                {lesson.title}
              </h1>
              <p className="text-label-sm text-on-surface-variant mt-1 font-medium">
                Lesson duration: {Math.round(lesson.duration_seconds / 60)} minutes
              </p>
            </div>

            <hr className="border-outline-variant/20" />

            <article className="prose max-w-none text-body-md text-on-surface space-y-md">
              <h3 className="text-label-md font-bold text-secondary uppercase tracking-wider">Lesson Material</h3>
              <p className="whitespace-pre-line leading-relaxed">
                {lesson.content_text || 'No written materials provided for this lesson.'}
              </p>
            </article>

            {/* Navigation / Next Step Buttons */}
            <div className="pt-xl border-t border-outline-variant/20 flex flex-col sm:flex-row justify-between items-center gap-md">
              <div>
                {course && (
                  <Link to={`/learning-path/${course.learning_path}`} className="text-secondary text-label-md font-bold flex items-center gap-1 hover:underline">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Back to Learning Path
                  </Link>
                )}
              </div>

              <div className="flex gap-md w-full sm:w-auto justify-end">
                {lesson.has_quiz && lesson.quiz_id ? (
                  <Link
                    to={`/quiz/${lesson.quiz_id}`}
                    className="h-12 px-xl bg-tertiary-container text-on-tertiary-container rounded-xl text-label-md font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1 shadow-md"
                  >
                    <span className="material-symbols-outlined text-sm">fact_check</span>
                    Take Quiz
                  </Link>
                ) : nextLesson ? (
                  <Link
                    to={`/lesson/${nextLesson.id}`}
                    className="h-12 px-xl bg-primary text-on-primary rounded-xl text-label-md font-bold hover:opacity-95 transition-opacity flex items-center justify-center gap-1 shadow-md"
                  >
                    Next Lesson
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                ) : (
                  course && (
                    <Link
                      to={`/learning-path/${course.learning_path}`}
                      className="h-12 px-xl bg-primary text-on-primary rounded-xl text-label-md font-bold hover:opacity-95 transition-opacity flex items-center justify-center gap-1 shadow-md"
                    >
                      Finish Course
                      <span className="material-symbols-outlined text-sm">done</span>
                    </Link>
                  )
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
