const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')

export const buildApiUrl = (path) => `${API_BASE_URL}${path}`

export class ApiError extends Error {}

export const apiRequest = async (path, { auth = false, ...options } = {}) => {
    const headers = new Headers(options.headers)
    if (!headers.has('Accept')) headers.set('Accept', 'application/json')
    if (auth) {
        const token = localStorage.getItem('accessToken')
        if (token) headers.set('Authorization', `Bearer ${token}`)
    }

    let response
    try {
        response = await fetch(buildApiUrl(path), { ...options, headers })
    } catch {
        throw new ApiError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
    }

    const result = await response.json().catch(() => null)
    if (!response.ok || result?.success === false) {
        throw new ApiError(result?.message || '요청을 처리하지 못했습니다.')
    }
    return result?.data ?? null
}

export const getPageContent = (data) => {
    if (Array.isArray(data)) return data
    return Array.isArray(data?.content) ? data.content : []
}
