const ADMIN_KEY_STORAGE = 'shulker_admin_key'

export function getAdminKey(): string | null {
  return sessionStorage.getItem(ADMIN_KEY_STORAGE)
}

export function setAdminKey(key: string): void {
  sessionStorage.setItem(ADMIN_KEY_STORAGE, key)
}

export function clearAdminKey(): void {
  sessionStorage.removeItem(ADMIN_KEY_STORAGE)
}

export function adminHeaders(): Record<string, string> {
  const key = getAdminKey()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (key) {
    headers['X-Admin-Key'] = key
  }
  return headers
}

export async function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`/api${path}`, {
    ...options,
    headers: {
      ...adminHeaders(),
      ...(options.headers || {}),
    },
  })
}

export async function adminGet<T>(path: string): Promise<T> {
  const res = await adminFetch(path)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export async function adminPost<T>(path: string, body: unknown): Promise<T> {
  const res = await adminFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}
