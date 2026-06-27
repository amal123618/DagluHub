import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Navbar from '../components/Navbar'
import useApi from '../hooks/useApi'
import { getQuiz, getLesson } from '../api/courses'
import { submitQuiz } from '../api/user'
import { useAuth } from '../context/AuthContext'

export default function QuizView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  // 1. Fetch Quiz details
  const { data: quiz, loading: quizLoading, error: quizError } = useApi(() => getQuiz(id), [id])
  const { data: lesson } = useApi(() => getLesson(quiz.lesson), [quiz?.lesson], { skip: !quiz })

  // State
  const [selectedAnswers, setSelectedAnswers] = useState({}) // { questionId: selectedOptionId }
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null) // { score, passed, results: [...] }
  const [errorMsg, setErrorMsg] = useState('')

  const handleSelectOption = (questionId, optionId) => {
    if (result) return // Disable selection after submission
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }))
  }

  const handleSubmit = async () => {
    if (!quiz || submitting) return
    setErrorMsg('')

    // Validate all questions are answered
    const totalQuestions = quiz.questions.length
    const answeredCount = Object.keys(selectedAnswers).length
    if (answeredCount < totalQuestions) {
      setErrorMsg('Please answer all questions before submitting.')
      return
    }

    setSubmitting(true)
    try {
      const payload = Object.entries(selectedAnswers).map(([qId, optId]) => ({
        question_id: parseInt(qId),
        selected_option_id: optId
      }))
      const res = await submitQuiz(quiz.id, payload)
      setResult(res)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit quiz. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetry = () => {
    setResult(null)
    setSelectedAnswers({})
    setErrorMsg('')
  }

  if (quizLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (quizError || !quiz) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center p-xl text-center">
          <span className="material-symbols-outlined text-error text-6xl mb-md">warning</span>
          <h2 className="font-display text-headline-md text-primary mb-sm">Quiz Not Found</h2>
          <p className="text-body-md text-on-surface-variant mb-lg">
            This quiz is unavailable or you need to log in to access it.
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

      <div className="max-w-3xl mx-auto px-gutter">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-xs text-label-sm text-on-surface-variant mb-lg">
          <Link to="/" className="hover:text-primary transition-colors">Browse</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          {lesson && (
            <>
              <Link to={`/lesson/${lesson.id}`} className="hover:text-primary transition-colors truncate max-w-[150px]">
                {lesson.title}
              </Link>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </>
          )}
          <span className="text-primary font-semibold">Quiz</span>
        </div>

        {/* Quiz Title Card */}
        <section className="bg-white border border-outline-variant/30 rounded-2xl p-xl shadow-sm mb-xl">
          <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Knowledge Check</span>
          <h1 className="font-display text-headline-md text-primary font-bold mt-1">
            {quiz.title}
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Passing threshold: <strong className="text-primary">80%</strong> • Correctly answer all questions for instant credit.
          </p>
        </section>

        {/* Quiz Submission Results Banner */}
        {result && (
          <section className={`p-lg rounded-2xl border mb-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md shadow-lg ${
            result.passed
              ? 'bg-secondary-container text-on-secondary-container border-secondary/20'
              : 'bg-error-container text-on-error-container border-error/20'
          }`}>
            <div>
              <h2 className="font-display text-headline-md font-bold">
                {result.passed ? '🎉 Congratulations! You Passed' : '❌ Please Try Again'}
              </h2>
              <p className="text-body-sm opacity-90 mt-1">
                Your Score: <strong className="text-lg">{result.score}</strong> (Required: 80% or higher)
              </p>
            </div>
            <div className="flex gap-sm">
              {!result.passed && (
                <button
                  onClick={handleRetry}
                  className="bg-primary text-on-primary px-lg py-2.5 rounded-xl text-label-md font-bold hover:opacity-90 transition-opacity shadow-sm"
                >
                  Retry Quiz
                </button>
              )}
              {lesson && (
                <Link
                  to={`/lesson/${lesson.id}`}
                  className="bg-surface text-primary border border-outline px-lg py-2.5 rounded-xl text-label-md font-bold hover:bg-surface-container-high transition-colors shadow-sm"
                >
                  Return to Lesson
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Questions Outline */}
        <div className="space-y-xl">
          {quiz.questions.map((question, qIdx) => {
            const questionResult = result?.results?.find(r => r.question_id === question.id)
            const isCorrect = questionResult?.is_correct
            const selectedOptId = selectedAnswers[question.id]

            return (
              <div
                key={question.id}
                className={`bg-white border border-outline-variant/30 rounded-2xl p-xl shadow-sm relative overflow-hidden ${
                  result
                    ? isCorrect
                      ? 'border-l-8 border-l-secondary'
                      : 'border-l-8 border-l-error'
                    : ''
                }`}
              >
                {/* Correct/Incorrect Badge */}
                {result && (
                  <div className="absolute top-4 right-4 flex items-center gap-1">
                    {isCorrect ? (
                      <span className="bg-secondary-container text-on-secondary-container px-sm py-1 rounded-full text-label-sm font-bold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-sm">check_circle</span> Correct
                      </span>
                    ) : (
                      <span className="bg-error-container text-on-error-container px-sm py-1 rounded-full text-label-sm font-bold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-sm">cancel</span> Incorrect
                      </span>
                    )}
                  </div>
                )}

                <h3 className="font-display text-headline-sm text-primary font-bold pr-24">
                  {qIdx + 1}. {question.question_text}
                </h3>

                {/* Option Choices */}
                <div className="mt-lg space-y-md">
                  {question.options.map((option) => {
                    const isSelected = selectedOptId === option.id
                    const isCorrectAnswer = result && questionResult?.correct_option_id === option.id

                    let optionStyle = 'border-outline-variant hover:bg-surface-container-low'
                    if (isSelected) {
                      optionStyle = 'border-primary bg-primary-fixed/20'
                    }
                    if (result) {
                      if (isCorrectAnswer) {
                        optionStyle = 'border-secondary bg-secondary-container text-on-secondary-container'
                      } else if (isSelected && !isCorrect) {
                        optionStyle = 'border-error bg-error-container text-on-error-container'
                      } else {
                        optionStyle = 'border-outline-variant opacity-60'
                      }
                    }

                    return (
                      <label
                        key={option.id}
                        onClick={() => handleSelectOption(question.id, option.id)}
                        className={`flex items-center gap-md p-md rounded-xl border-2 cursor-pointer transition-all ${optionStyle}`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={isSelected}
                          disabled={Boolean(result)}
                          onChange={() => {}}
                          className="w-4 h-4 text-primary focus:ring-primary border-outline"
                        />
                        <span className="text-label-md font-medium">{option.option_text}</span>
                      </label>
                    )
                  })}
                </div>

                {/* Explanation Drawer */}
                {result && questionResult?.explanation && (
                  <div className="mt-xl p-md bg-surface-container rounded-xl border border-outline-variant/30 text-body-sm text-on-surface-variant flex gap-sm items-start">
                    <span className="material-symbols-outlined text-secondary icon-filled shrink-0">info</span>
                    <div>
                      <strong className="text-primary block mb-0.5">Explanation</strong>
                      {questionResult.explanation}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Submit Bar */}
        {!result && (
          <div className="mt-xl flex flex-col items-center gap-md">
            {errorMsg && (
              <div className="p-md bg-error-container text-on-error-container rounded-xl text-label-md font-semibold flex items-center gap-sm shadow-sm w-full">
                <span className="material-symbols-outlined text-sm">warning</span>
                {errorMsg}
              </div>
            )}

            {!isAuthenticated ? (
              <p className="text-body-sm text-on-surface-variant italic">
                You must be signed in to submit quizzes and earn certificates.
              </p>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full sm:w-64 h-12 bg-primary text-on-primary rounded-xl text-label-md font-bold hover:opacity-95 transition-opacity flex items-center justify-center gap-sm shadow-md disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                {submitting ? 'Submitting Answers...' : 'Submit Quiz'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
