/**
 * API base client.
 *
 * A lightweight fetch wrapper that:
 *  - Points all requests at the Django backend (http://127.0.0.1:8000)
 *  - Reads the auth token from localStorage and attaches it automatically
 *  - Parses JSON responses
 *  - Throws a structured { status, message, data } error on non-2xx responses
 */

const BASE_URL = 'http://127.0.0.1:8000'

function getToken() {
  return localStorage.getItem('dagluhub_token')
}

async function request(method, path, body = null) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Token ${token}`
  }

  const config = {
    method,
    headers,
  }

  if (body !== null) {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(`${BASE_URL}${path}`, config)

  // Parse the body (even on errors, Django returns JSON details)
  let data
  const contentType = response.headers.get('Content-Type') || ''
  if (contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  if (!response.ok) {
    const message =
      (data && (data.detail || data.error || data.non_field_errors?.[0])) ||
      `HTTP ${response.status}`
    const error = new Error(message)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

const client = {
  get:    (path)         => request('GET',    path),
  post:   (path, body)   => request('POST',   path, body),
  put:    (path, body)   => request('PUT',    path, body),
  patch:  (path, body)   => request('PATCH',  path, body),
  delete: (path)         => request('DELETE', path),
}

export default client
