const SESSION_KEY = 'shulker_session_id'

export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export function clearSessionId(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function sessionHeaders(): Record<string, string> {
  return { 'X-Session-Id': getSessionId() }
}
