import { useState, useEffect, useCallback } from 'react'

/**
 * useApi — generic data-fetching hook.
 *
 * @param {Function} apiFn   - The API function to call (from src/api/*)
 * @param {Array}    deps    - Dependency array (re-fetches when these change)
 * @param {Object}   options
 *   @param {boolean} options.skip  - If true, don't fetch on mount (useful for auth-gated calls)
 *
 * @returns {{ data, loading, error, refetch }}
 *
 * Example:
 *   const { data: paths, loading, error } = useApi(getLearningPaths, [])
 */
export default function useApi(apiFn, deps = [], { skip = false } = {}) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(!skip)
  const [error, setError]     = useState(null)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFn()
      setData(result)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [apiFn]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (skip) return
    execute()
  }, [skip, ...deps]) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch: execute }
}
