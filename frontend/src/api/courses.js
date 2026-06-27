/**
 * Courses API — public endpoints (no auth required).
 */
import client from './client'

/**
 * Fetch all learning paths with their nested courses.
 * Response: [{ id, title, description, difficulty_level, courses: [...] }]
 */
export const getLearningPaths = () => client.get('/api/learning-paths/')

/**
 * Fetch all courses with their nested lessons.
 * Response: [{ id, title, description, thumbnail, is_premium, lessons: [...] }]
 */
export const getCourses = () => client.get('/api/courses/')

/**
 * Fetch a single course by ID.
 */
export const getCourse = (id) => client.get(`/api/courses/${id}/`)

/**
 * Fetch all lessons (lightweight list).
 */
export const getLessons = () => client.get('/api/lessons/')

/**
 * Fetch a single lesson with full content + quiz flag.
 * Automatically initialises a LessonProgress record if authenticated.
 */
export const getLesson = (id) => client.get(`/api/lessons/${id}/`)

/**
 * Fetch a single quiz with questions and choices.
 */
export const getQuiz = (id) => client.get(`/api/quizzes/${id}/`)

