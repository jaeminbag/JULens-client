import { apiRequest, getPageContent } from './client.js'

export const getLatestLensAnalyses = async () => getPageContent(
    await apiRequest('/lens-analyses/latest'),
)

export const getStockNews = async () => getPageContent(
    await apiRequest('/stock-news'),
)

export const getLatestUserStocks = async () => getPageContent(
    await apiRequest('/user-stocks/latest', { auth: true }),
)

export const getStockDetail = (ticker) => apiRequest(
    `/stocks/${encodeURIComponent(ticker)}/detail`,
    { auth: true },
)
