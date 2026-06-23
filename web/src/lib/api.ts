export async function safeJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(text || `Request failed with status ${response.status}`)
  }
}

export async function apiError(response: Response): Promise<Error> {
  try {
    const data = await response.json()
    return new Error(data.detail || data.message || `Request failed (${response.status})`)
  } catch {
    const text = await response.text().catch(() => '')
    return new Error(text || `Request failed with status ${response.status}`)
  }
}
