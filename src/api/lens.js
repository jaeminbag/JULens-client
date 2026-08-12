import { apiRequest, getPageContent } from './client.js'

const buildQuery = (params) => {
    const query = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
            query.set(key, value)
        }
    })

    return query.toString()
}

export const getLatestLensAnalyses = (params) => apiRequest(
    `/lens-analyses/latest?${buildQuery(params)}`,
)

export const getStockNews = (params) => apiRequest(
    `/stock-news?${buildQuery(params)}`,
)

export const getLatestUserStocks = async () => getPageContent(
    await apiRequest('/user-stocks/latest', { auth: true }),
)

export const getUserStocks = async () => getPageContent(
    await apiRequest('/user-stocks', { auth: true }),
)

export const addUserStock = (stockId) => apiRequest(
    `/user-stocks/${stockId}`,
    { auth: true, method: 'PUT' },
)

export const deleteUserStock = (stockId) => apiRequest(
    `/user-stocks/${stockId}`,
    { auth: true, method: 'DELETE' },
)

export const getStockDetail = (ticker) => apiRequest(
    `/stocks/${encodeURIComponent(ticker)}/detail`,
)
