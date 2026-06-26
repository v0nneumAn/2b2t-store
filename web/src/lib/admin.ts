export async function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`/api${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
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
