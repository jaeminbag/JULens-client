import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addUserStock, deleteUserStock, getStockDetail, getStockPriceHistories, getUserStocks } from '../api/lens.js'
import AsyncState from '../components/AsyncState.jsx'
import SiteHeader from '../components/SiteHeader.jsx'
import PriceLineChart from '../components/PriceLineChart.jsx'
import RealtimeFeedBadge from '../components/RealtimeFeedBadge.jsx'
import DualPrice from '../components/DualPrice.jsx'
import { useSiteFeedback } from '../components/SiteFeedback.jsx'
import { hasValidAccessToken } from '../utils/auth.js'
import { formatLensLabel, formatMarketSession } from '../utils/lensLabels.js'
import { getStockDisplayNames } from '../utils/stockNames.js'
import { mergeRealtimePoints, useRealtimePrices } from '../hooks/useRealtimePrices.js'
import { useUsdKrwRate } from '../hooks/useUsdKrwRate.js'
import './TodayLensPage.css'

const value = (number, suffix = '') => number == null
    ? '—'
    : `${Number(number).toLocaleString('en-US', { maximumFractionDigits: 2 })}${suffix}`

const formatDate = (date) => date
    ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
    : ''

export default function StockDetailPage() {
    const { ticker } = useParams()
    const navigate = useNavigate()
    const { showToast } = useSiteFeedback()
    const loggedIn = hasValidAccessToken()
    const [detail, setDetail] = useState(null)
    const [watchedStockIds, setWatchedStockIds] = useState([])
    const [savingWatchlist, setSavingWatchlist] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [reload, setReload] = useState(0)
    const [pricePeriod, setPricePeriod] = useState('REALTIME')
    const [priceHistory, setPriceHistory] = useState(null)
    const [chartLoading, setChartLoading] = useState(true)
    const exchangeRate = useUsdKrwRate()

    useEffect(() => {
        let active = true

        getStockDetail(ticker).then((data) => {
            if (active) setDetail(data)
        }).catch((requestError) => {
            if (active) setError(requestError.message)
        }).finally(() => {
            if (active) setLoading(false)
        })

        return () => { active = false }
    }, [ticker, reload])

    useEffect(() => {
        let active = true
        let timer

        const loadPriceHistory = async () => {
            setChartLoading(true)
            try {
                const histories = await getStockPriceHistories([ticker], pricePeriod)
                if (active) setPriceHistory(histories?.[0] ?? null)
            } catch {
                if (active) setPriceHistory(null)
            } finally {
                if (active) setChartLoading(false)
            }
        }

        loadPriceHistory()
        // 정규장 개장 시각을 넘겨 오래 열어둔 화면도 새 세션으로 초기화한다.
        if (pricePeriod === 'REALTIME') timer = window.setInterval(loadPriceHistory, 60_000)
        return () => {
            active = false
            if (timer) window.clearInterval(timer)
        }
    }, [ticker, pricePeriod, reload])

    useEffect(() => {
        if (!loggedIn) return
        let active = true

        getUserStocks().then((items) => {
            if (active) setWatchedStockIds(items.map((item) => item.id))
        }).catch(() => {
            if (active) setWatchedStockIds([])
        })

        return () => { active = false }
    }, [loggedIn])

    const stock = detail?.stock
    const { prices: realtimePrices, points: realtimePoints } = useRealtimePrices(stock?.ticker ? [stock.ticker] : [])
    const { primaryName, secondaryName } = getStockDisplayNames(stock)
    const analysis = detail?.latestAnalysis
    const news = detail?.news ?? []
    const watched = stock ? watchedStockIds.includes(stock.id) : false
    const currentPrice = realtimePrices[stock?.ticker]?.price ?? analysis?.currentPrice
    const basePoints = priceHistory?.points
        ?? (pricePeriod === 'REALTIME' ? detail?.priceHistory : [])
    const chartPoints = pricePeriod === 'REALTIME'
        ? mergeRealtimePoints(
            basePoints,
            realtimePoints[stock?.ticker],
            priceHistory?.windowStart,
        )
        : basePoints
    const retry = () => {
        setLoading(true)
        setError('')
        setReload((current) => current + 1)
    }
    const toggleWatchlist = async () => {
        if (!loggedIn) {
            navigate('/community', { state: { openLogin: true } })
            return
        }

        setSavingWatchlist(true)
        try {
            if (watched) {
                await deleteUserStock(stock.id)
                setWatchedStockIds((ids) => ids.filter((id) => id !== stock.id))
                showToast({ title: '관심 종목 해제', message: `${stock.ticker}를 관심 종목에서 제거했습니다.`, type: 'info' })
            } else {
                await addUserStock(stock.id)
                setWatchedStockIds((ids) => [...ids, stock.id])
                showToast({ title: '관심 종목 추가', message: `${stock.ticker}를 관심 종목에 추가했습니다.`, type: 'success' })
            }
        } catch (requestError) {
            showToast({ title: '관심 종목 변경 실패', message: requestError.message, type: 'error' })
        } finally {
            setSavingWatchlist(false)
        }
    }

    return <main className="today-lens-page">
        <SiteHeader activePage="today-lens" isLoggedIn={loggedIn} onLoginClick={() => navigate('/community', { state: { openLogin: true } })} onLogoutClick={() => { localStorage.removeItem('accessToken'); navigate('/') }} />
        <section className="lens-shell stock-detail">
            <button className="back" onClick={() => navigate(-1)}>← 목록으로</button>
            <AsyncState loading={loading} error={error} onRetry={retry} />
            {stock && !loading && !error && <>
                <header className="stock-detail-header"><div><span>{stock.ticker} · {stock.exchange}</span><h1>{primaryName}</h1>{secondaryName && <p>{secondaryName}</p>}</div><button className={watched ? 'watch-button active' : 'watch-button'} disabled={savingWatchlist} onClick={toggleWatchlist}>{savingWatchlist ? '처리 중...' : watched ? '★ 관심 종목 해제' : '☆ 관심 종목 추가'}</button></header>
                <div className="detail-metrics"><article><span>현재가</span><DualPrice value={currentPrice} exchangeRate={exchangeRate} /><RealtimeFeedBadge feed={realtimePrices[stock.ticker]?.feed} /></article><article><span>등락률</span><b className={Number(analysis?.changeRate) >= 0 ? 'up' : 'down'}>{analysis && Number(analysis.changeRate) >= 0 ? '+' : ''}{value(analysis?.changeRate, '%')}</b></article><article><span>종합점수</span><b>{value(analysis?.totalScore)}</b></article><article><span>거래량</span><b>{value(analysis?.volume)}</b></article></div>
                <PriceLineChart
                    points={chartPoints}
                    feed={pricePeriod === 'REALTIME' ? realtimePrices[stock.ticker]?.feed : ''}
                    exchangeRate={exchangeRate}
                    period={pricePeriod}
                    onPeriodChange={setPricePeriod}
                    windowStart={priceHistory?.windowStart}
                    windowEnd={priceHistory?.windowEnd}
                    loading={chartLoading}
                />
                <article className="analysis-panel"><span>LATEST LENS ANALYSIS</span><h2>{analysis ? `${formatLensLabel(analysis.label)} · ${formatMarketSession(analysis.marketSession)}` : '최신 분석 없음'}</h2>{analysis ? <><div className="score-breakdown"><b>뉴스 {analysis.newsScore}</b><b>주가 {analysis.movementScore}</b><b>거래량 {analysis.volumeScore}</b><b>위험 {analysis.riskScore}</b></div><p>분석 시각 {formatDate(analysis.analyzedAt)}</p></> : <p>아직 완료된 분석 배치에 포함되지 않은 종목입니다.</p>}</article>
                <section className="detail-news"><div><span>RELATED NEWS</span><h2>관련 최신 뉴스</h2></div>{news.length === 0 ? <p>저장된 관련 뉴스가 없습니다.</p> : <div className="news-list">{news.map((item) => <article key={item.newsId} onClick={() => item.url && window.open(item.url, '_blank', 'noopener,noreferrer')}><div><span>{item.source}</span><time>{formatDate(item.publishedAt)}</time></div><h2>{item.title}</h2><p>{item.summary}</p><footer><i>원문 보기 ↗</i></footer></article>)}</div>}</section>
            </>}
        </section>
    </main>
}
