import { useEffect, useState } from 'react'
import { getLatestRealtimePrices, subscribeRealtimePrices } from '../api/realtime.js'

const MAX_POINTS_PER_TICKER = 300
const LATEST_PRICE_POLL_MILLIS = 5_000

const appendPoint = (points, quote) => {
    const point = { timestamp: quote.timestamp, price: Number(quote.price) }
    const withoutDuplicate = points.filter((item) => item.timestamp !== point.timestamp)
    return [...withoutDuplicate, point]
        .sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp))
        .slice(-MAX_POINTS_PER_TICKER)
}

/** 현재 화면에 노출된 종목만 구독하고, 화면 이탈 시 SSE 연결을 정리한다. */
export const useRealtimePrices = (tickers) => {
    const tickerKey = [...new Set(tickers.filter(Boolean))]
        .map((ticker) => ticker.toUpperCase())
        .sort()
        .join(',')
    const [prices, setPrices] = useState({})
    const [points, setPoints] = useState({})

    useEffect(() => {
        const symbols = tickerKey ? tickerKey.split(',') : []
        if (symbols.length === 0) return undefined

        let active = true
        let pollTimer
        const applyQuote = (quote) => {
            if (!active || !quote?.ticker || !Number.isFinite(Number(quote.price))) return
            const normalizedQuote = { ...quote, ticker: quote.ticker.toUpperCase() }
            setPrices((current) => ({
                ...current,
                [normalizedQuote.ticker]: normalizedQuote,
            }))
            setPoints((current) => ({
                ...current,
                [normalizedQuote.ticker]: appendPoint(
                    current[normalizedQuote.ticker] ?? [],
                    normalizedQuote,
                ),
            }))
        }
        const pollLatestPrices = async () => {
            try {
                const latestPrices = await getLatestRealtimePrices(symbols)
                if (active) (latestPrices ?? []).forEach(applyQuote)
            } catch {
                // EventSource 자동 재연결이 기본 경로이므로 보조 조회 실패는 조용히 재시도한다.
            } finally {
                if (active) {
                    pollTimer = window.setTimeout(
                        pollLatestPrices,
                        LATEST_PRICE_POLL_MILLIS,
                    )
                }
            }
        }

        const unsubscribe = subscribeRealtimePrices(symbols, {
            onPrice: applyQuote,
        })
        // SSE 이벤트가 프록시에 잠시 막혀도 최대 5초 안에 화면 가격을 따라잡는다.
        pollTimer = window.setTimeout(pollLatestPrices, 1_000)

        return () => {
            active = false
            unsubscribe()
            if (pollTimer) window.clearTimeout(pollTimer)
        }
    }, [tickerKey])

    return { prices, points }
}

export const mergeRealtimePoints = (history = [], realtimePoints = [], windowStart = null) => {
    const byTimestamp = new Map()
    ;[...history, ...realtimePoints].forEach((point) => {
        if (point?.timestamp && Number.isFinite(Number(point.price))) {
            byTimestamp.set(point.timestamp, { ...point, price: Number(point.price) })
        }
    })
    return [...byTimestamp.values()]
        .filter((point) => !windowStart || new Date(point.timestamp) >= new Date(windowStart))
        .sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp))
        .slice(-MAX_POINTS_PER_TICKER)
}
