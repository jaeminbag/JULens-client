import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLatestUserStocks } from '../api/lens.js'
import AsyncState from '../components/AsyncState.jsx'
import LensTabs from '../components/LensTabs.jsx'
import SiteHeader from '../components/SiteHeader.jsx'
import RealtimeFeedBadge from '../components/RealtimeFeedBadge.jsx'
import { hasValidAccessToken } from '../utils/auth.js'
import { formatLensLabel, formatMarketSession } from '../utils/lensLabels.js'
import { getStockDisplayNames } from '../utils/stockNames.js'
import { useRealtimePrices } from '../hooks/useRealtimePrices.js'
import './TodayLensPage.css'

const value = (number, suffix = '') => number == null
    ? '—'
    : `${Number(number).toLocaleString('en-US', { maximumFractionDigits: 2 })}${suffix}`

export default function WatchlistPage() {
    const navigate = useNavigate()
    const loggedIn = hasValidAccessToken()
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(loggedIn)
    const [error, setError] = useState('')
    const [reload, setReload] = useState(0)
    const { prices: realtimePrices } = useRealtimePrices(items.map((item) => item.stock?.ticker))

    useEffect(() => {
        if (!loggedIn) return
        let active = true

        getLatestUserStocks().then((data) => {
            if (active) setItems(data)
        }).catch((requestError) => {
            if (active) setError(requestError.message)
        }).finally(() => {
            if (active) setLoading(false)
        })

        return () => { active = false }
    }, [loggedIn, reload])

    const retry = () => {
        setLoading(true)
        setError('')
        setReload((current) => current + 1)
    }

    return <main className="today-lens-page">
        <SiteHeader activePage="today-lens" isLoggedIn={loggedIn} onLoginClick={() => navigate('/community', { state: { openLogin: true } })} onLogoutClick={() => { localStorage.removeItem('accessToken'); navigate('/') }} />
        <section className="lens-shell">
            <LensTabs />
            <header className="lens-title"><div><p>PERSONAL MARKET VIEW</p><h1>My <em>Watchlist.</em></h1></div><span>관심 종목의 최신 분석</span></header>
            {!loggedIn ? <div className="login-required"><span>MEMBERS ONLY</span><h2>로그인이 필요합니다.</h2><p>관심 종목과 최신 Lens 분석을 확인하려면 로그인해주세요.</p><button onClick={() => navigate('/community', { state: { openLogin: true } })}>로그인하기</button></div> : <>
                <AsyncState loading={loading} error={error} empty={!loading && !error && items.length === 0} onRetry={retry} />
                {!loading && !error && <div className="watch-list">{items.map((item) => {
                    const stock = item.stock
                    const analysis = item.latestAnalysis
                    const { primaryName } = getStockDisplayNames(stock)
                    return <button key={item.userStockId} onClick={() => navigate(`/stocks/${stock.ticker}`)}>
                        <div><b>{stock.ticker}</b><strong>{primaryName}</strong><span>{analysis ? `${formatLensLabel(analysis.label)} · ${formatMarketSession(analysis.marketSession)}` : '아직 최신 분석이 없습니다.'}</span></div>
                        <dl><div><dt>현재가</dt><dd>${value(realtimePrices[stock.ticker]?.price ?? analysis?.currentPrice)}</dd><RealtimeFeedBadge feed={realtimePrices[stock.ticker]?.feed} /></div><div><dt>등락률</dt><dd className={Number(analysis?.changeRate) >= 0 ? 'up' : 'down'}>{analysis && Number(analysis.changeRate) >= 0 ? '+' : ''}{value(analysis?.changeRate, '%')}</dd></div><div><dt>종합점수</dt><dd>{value(analysis?.totalScore)}</dd></div></dl><i>→</i>
                    </button>
                })}</div>}
            </>}
        </section>
    </main>
}
