import { apiRequest, buildApiUrl } from './client.js'

const MAX_IEX_SYMBOLS = 30

const normalizeTickers = (tickers) => [...new Set(
    tickers
        .map((ticker) => ticker?.trim().toUpperCase())
        .filter(Boolean),
)].slice(0, MAX_IEX_SYMBOLS)

/**
 * 브라우저의 EventSource로 백엔드 IEX/Overnight SSE 스트림을 구독한다.
 * EventSource가 네트워크 단절 시 자동 재연결하므로 오류 때 즉시 닫지 않는다.
 */
export const subscribeRealtimePrices = (tickers, handlers = {}) => {
    const symbols = normalizeTickers(tickers)
    if (symbols.length === 0) return () => {}

    const query = new URLSearchParams()
    symbols.forEach((ticker) => query.append('tickers', ticker))
    // 일부 배포 프록시가 이전 SSE 응답을 재사용하지 않도록 연결마다 식별자를 둔다.
    query.set('streamId', `${Date.now()}`)

    const eventSource = new EventSource(buildApiUrl(`/stocks/realtime?${query}`))

    eventSource.addEventListener('ready', () => handlers.onReady?.())
    eventSource.addEventListener('price', (event) => {
        try {
            const price = JSON.parse(event.data)
            if (price?.ticker && Number.isFinite(Number(price.price))) {
                handlers.onPrice?.({ ...price, ticker: price.ticker.toUpperCase() })
            }
        } catch {
            handlers.onInvalidEvent?.()
        }
    })
    eventSource.onerror = () => handlers.onError?.()

    return () => eventSource.close()
}

/** SSE가 프록시에서 잠시 끊겨도 서버 메모리의 최신 가격을 보조 조회한다. */
export const getLatestRealtimePrices = (tickers) => {
    const symbols = normalizeTickers(tickers)
    if (symbols.length === 0) return Promise.resolve([])

    const query = new URLSearchParams()
    symbols.forEach((ticker) => query.append('tickers', ticker))
    return apiRequest(`/stocks/realtime/latest?${query}`)
}
