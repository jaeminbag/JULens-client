import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLatestLensAnalyses, getStockPriceHistories } from '../api/lens.js'
import AsyncState from '../components/AsyncState.jsx'
import LensTabs from '../components/LensTabs.jsx'
import Pagination from '../components/Pagination.jsx'
import SiteHeader from '../components/SiteHeader.jsx'
import PriceLineChart from '../components/PriceLineChart.jsx'
import { useSiteFeedback } from '../components/SiteFeedback.jsx'
import { hasValidAccessToken } from '../utils/auth.js'
import { formatLensLabel, formatMarketSession } from '../utils/lensLabels.js'
import { getStockDisplayNames } from '../utils/stockNames.js'
import { mergeRealtimePoints, useRealtimePrices } from '../hooks/useRealtimePrices.js'
import './TodayLensPage.css'

const PAGE_SIZE = 9
const number = (value) => Number(value ?? 0)
const money = (value) => value == null ? '—' : `$${number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
const SORT_OPTIONS = {
    score: ['TOTAL_SCORE', 'DESC'],
    name: ['COMPANY_NAME', 'ASC'],
    volume: ['VOLUME', 'DESC'],
    priceAsc: ['CURRENT_PRICE', 'ASC'],
    priceDesc: ['CURRENT_PRICE', 'DESC'],
}

export default function TodayLensPage() {
    const navigate = useNavigate()
    const { showToast } = useSiteFeedback()
    const [loggedIn, setLoggedIn] = useState(hasValidAccessToken)
    const [result, setResult] = useState({ content: [], totalPages: 0, totalElements: 0 })
    const [priceHistories, setPriceHistories] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [query, setQuery] = useState('')
    const [sort, setSort] = useState('score')
    const [minPrice, setMinPrice] = useState('')
    const [maxPrice, setMaxPrice] = useState('')
    const [page, setPage] = useState(1)
    const [reload, setReload] = useState(0)

    const visibleTickers = (result.content ?? []).map((item) => item.ticker)
    const { prices: realtimePrices, points: realtimePoints } = useRealtimePrices(visibleTickers)

    useEffect(() => {
        let active = true
        const [sortBy, direction] = SORT_OPTIONS[sort]

        getLatestLensAnalyses({
            keyword: query.trim(),
            minPrice,
            maxPrice,
            sortBy,
            direction,
            page: page - 1,
            size: PAGE_SIZE,
        }).then(async (data) => {
            if (!active) return
            const nextResult = data ?? { content: [], totalPages: 0, totalElements: 0 }
            setResult(nextResult)
            const tickers = (nextResult.content ?? []).map((item) => item.ticker)
            if (tickers.length === 0) {
                setPriceHistories({})
                return
            }
            try {
                const histories = await getStockPriceHistories(tickers)
                if (active) setPriceHistories(Object.fromEntries((histories ?? []).map((history) => [history.ticker, history.points ?? []])))
            } catch {
                if (active) setPriceHistories({})
            }
        }).catch((requestError) => {
            if (active) setError(requestError.message)
        }).finally(() => {
            if (active) setLoading(false)
        })

        return () => { active = false }
    }, [query, sort, minPrice, maxPrice, page, reload])

    const items = result.content ?? []
    const totalPages = Math.max(1, result.totalPages ?? 0)
    const updateFilter = (setter) => (event) => {
        setLoading(true)
        setError('')
        setter(event.target.value)
        setPage(1)
    }
    const changePage = (nextPage) => {
        setLoading(true)
        setError('')
        setPage(nextPage)
    }
    const retry = () => {
        setLoading(true)
        setError('')
        setReload((value) => value + 1)
    }
    const logout = () => {
        localStorage.removeItem('accessToken')
        setLoggedIn(false)
        showToast({ title: '로그아웃 완료', message: '안전하게 로그아웃되었습니다.', type: 'info' })
    }

    return <main className="today-lens-page">
        <SiteHeader activePage="today-lens" isLoggedIn={loggedIn} onLoginClick={() => navigate('/community', { state: { openLogin: true } })} onLogoutClick={logout} />
        <section className="lens-shell">
            <LensTabs />
            <header className="lens-title"><div><p>DAILY MARKET INTELLIGENCE</p><h1>Today&apos;s <em>Lens.</em></h1></div><span>최신 완료 분석 · 총 {result.totalElements ?? 0}개 종목</span></header>
            <div className="lens-controls">
                <label className="search-field"><span>SEARCH</span><input value={query} onChange={updateFilter(setQuery)} placeholder="회사명 또는 티커 검색" /></label>
                <label><span>SORT BY</span><select value={sort} onChange={updateFilter(setSort)}><option value="score">종합점수순</option><option value="name">이름순</option><option value="volume">거래량순</option><option value="priceAsc">낮은 가격순</option><option value="priceDesc">높은 가격순</option></select></label>
                <label><span>MIN PRICE</span><input type="number" min="0" value={minPrice} onChange={updateFilter(setMinPrice)} placeholder="$ 0" /></label>
                <label><span>MAX PRICE</span><input type="number" min="0" value={maxPrice} onChange={updateFilter(setMaxPrice)} placeholder="$ ∞" /></label>
            </div>
            <AsyncState loading={loading} error={error} empty={!loading && !error && items.length === 0} onRetry={retry} />
            {!loading && !error && <div className="stock-grid">{items.map((item) => {
                const { primaryName, secondaryName } = getStockDisplayNames(item)
                const realtimePrice = realtimePrices[item.ticker]
                return <article className="stock-card" key={item.analysisId} onClick={() => navigate(`/stocks/${item.ticker}`)}>
                    <div className="stock-card-top"><span>{item.ticker}</span><strong>{number(item.totalScore)}</strong></div>
                    <h2>{primaryName}</h2>{secondaryName && <p>{secondaryName}</p>}
                    <PriceLineChart points={mergeRealtimePoints(priceHistories[item.ticker], realtimePoints[item.ticker])} compact realtime={Boolean(realtimePrice)} />
                    <div className="stock-metrics"><span>현재가 <b>{money(realtimePrice?.price ?? item.currentPrice)}</b>{realtimePrice && <i className="realtime-badge">IEX 실시간</i>}</span><span>등락률 <b className={number(item.changeRate) >= 0 ? 'up' : 'down'}>{number(item.changeRate) >= 0 ? '+' : ''}{number(item.changeRate).toFixed(2)}%</b></span><span>거래량 <b>{number(item.volume).toLocaleString()}</b></span></div>
                    <small>{item.exchange} · {formatMarketSession(item.marketSession)} · {formatLensLabel(item.label)}</small>
                </article>
            })}</div>}
            {!loading && !error && items.length > 0 && <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} onChange={changePage} />}
        </section>
    </main>
}
