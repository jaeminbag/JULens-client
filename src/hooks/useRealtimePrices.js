import { useEffect, useState } from 'react'
import { subscribeRealtimePrices } from '../api/realtime.js'

const MAX_POINTS_PER_TICKER = 300

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

        return subscribeRealtimePrices(symbols, {
            onPrice: (quote) => {
                setPrices((current) => ({ ...current, [quote.ticker]: quote }))
                setPoints((current) => ({
                    ...current,
                    [quote.ticker]: appendPoint(current[quote.ticker] ?? [], quote),
                }))
            },
        })
    }, [tickerKey])

    return { prices, points }
}

export const mergeRealtimePoints = (history = [], realtimePoints = []) => {
    const byTimestamp = new Map()
    ;[...history, ...realtimePoints].forEach((point) => {
        if (point?.timestamp && Number.isFinite(Number(point.price))) {
            byTimestamp.set(point.timestamp, { ...point, price: Number(point.price) })
        }
    })
    return [...byTimestamp.values()]
        .sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp))
        .slice(-MAX_POINTS_PER_TICKER)
}
