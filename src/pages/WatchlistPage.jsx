import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLatestUserStocks } from '../api/lens.js'
import AsyncState from '../components/AsyncState.jsx'
import LensTabs from '../components/LensTabs.jsx'
import SiteHeader from '../components/SiteHeader.jsx'
import { hasValidAccessToken } from '../utils/auth.js'
import './TodayLensPage.css'

const value = (number, suffix = '') => number == null ? '—' : `${Number(number).toLocaleString('en-US', { maximumFractionDigits: 2 })}${suffix}`

export default function WatchlistPage() {
    const navigate = useNavigate(); const loggedIn = hasValidAccessToken(); const [items, setItems] = useState([]); const [loading, setLoading] = useState(loggedIn); const [error, setError] = useState(''); const [reload, setReload] = useState(0)
    useEffect(() => { if (!loggedIn) return; let active = true; getLatestUserStocks().then((v) => active && setItems(v)).catch((e) => active && setError(e.message)).finally(() => active && setLoading(false)); return () => { active = false } }, [loggedIn, reload])
    return <main className="today-lens-page"><SiteHeader activePage="today-lens" isLoggedIn={loggedIn} onLoginClick={() => navigate('/community', { state: { openLogin: true } })} onLogoutClick={() => { localStorage.removeItem('accessToken'); navigate('/') }} /><section className="lens-shell"><LensTabs /><header className="lens-title"><div><p>PERSONAL MARKET VIEW</p><h1>My <em>Watchlist.</em></h1></div><span>관심 종목의 최신 분석</span></header>
        {!loggedIn ? <div className="login-required"><span>MEMBERS ONLY</span><h2>로그인이 필요합니다.</h2><p>관심 종목과 최신 Lens 분석을 확인하려면 로그인해주세요.</p><button onClick={() => navigate('/community', { state: { openLogin: true } })}>로그인하기</button></div> : <><AsyncState loading={loading} error={error} empty={!loading && !error && !items.length} onRetry={() => { setLoading(true); setError(''); setReload((v) => v + 1) }} />{!loading && !error && <div className="watch-list">{items.map((item) => <button key={item.ticker} onClick={() => navigate(`/stocks/${item.ticker}`)}><div><b>{item.ticker}</b><strong>{item.companyNameKo || item.companyNameEn}</strong><span>{item.latestAnalysisSummary || item.analysisSummary || '최신 분석을 확인하세요.'}</span></div><dl><div><dt>현재가</dt><dd>${value(item.currentPrice)}</dd></div><div><dt>등락률</dt><dd className={Number(item.changeRate) >= 0 ? 'up' : 'down'}>{Number(item.changeRate) >= 0 ? '+' : ''}{value(item.changeRate, '%')}</dd></div><div><dt>종합점수</dt><dd>{value(item.overallScore)}</dd></div></dl><i>→</i></button>)}</div>}</>}</section></main>
}
