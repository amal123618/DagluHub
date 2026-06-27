/**
 * Auth API — login, logout, current user profile.
 * Also includes learner-specific endpoints: progress and certificates.
 */
import client from './client'

// ── Authentication ───────────────────────────────────────────────────────────

/**
 * Login with username + password.
 * Returns { token: string, user: { id, username, email, role } }
 */
export const login = (username, password) =>
  client.post('/api/auth/login/', { username, password })

/**
 * Invalidate the current token (server-side logout).
 */
export const logout = () => client.post('/api/auth/logout/')

/**
 * Fetch the authenticated user's profile.
 * Used on app startup to restore a session from a stored token.
 */
export const getMe = () => client.get('/api/auth/me/')

// ── Learner Data (require authentication) ────────────────────────────────────

/**
 * Fetch all lesson progress records for the current user.
 * Response: [{ id, lesson, lesson_title, is_completed, watched_seconds, completed_at }]
 */
export const getProgress = () => client.get('/api/progress/')

/**
 * Fetch all certificates earned by the current user.
 * Response: [{ id, certificate_uuid, learning_path, learning_path_title, issued_at }]
 */
export const getCertificates = () => client.get('/api/certificates/')

/**
 * Claim a certificate for a completed learning path.
 * Returns the certificate object (201 if new, 200 if already exists).
 */
export const claimCertificate = (learningPathId) =>
  client.post(`/api/learning-paths/${learningPathId}/claim-certificate/`)

/**
 * Track lesson watch progress.
 * Body: { watched_seconds: number }
 */
export const trackProgress = (lessonId, watchedSeconds) =>
  client.post(`/api/lessons/${lessonId}/track-progress/`, {
    watched_seconds: watchedSeconds,
  })

/**
 * Submit answers for a quiz.
 * Body: { answers: [{ question_id, selected_option_id }] }
 */
export const submitQuiz = (quizId, answers) =>
  client.post(`/api/quizzes/${quizId}/submit/`, {
    answers,
  })

