import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLatestLensAnalyses } from '../api/lens.js'
import AsyncState from '../components/AsyncState.jsx'
import LensTabs from '../components/LensTabs.jsx'
import Pagination from '../components/Pagination.jsx'
import SiteHeader from '../components/SiteHeader.jsx'
import { useSiteFeedback } from '../components/SiteFeedback.jsx'
import { hasValidAccessToken } from '../utils/auth.js'
import './TodayLensPage.css'

const PAGE_SIZE = 9
const number = (value) => Number(value ?? 0)
const money = (value) => value == null ? '—' : `$${number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })}`

export default function TodayLensPage() {
    const navigate = useNavigate()
    const { showToast } = useSiteFeedback()
    const [loggedIn, setLoggedIn] = useState(hasValidAccessToken)
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [query, setQuery] = useState('')
    const [sort, setSort] = useState('score')
    const [minPrice, setMinPrice] = useState('')
    const [maxPrice, setMaxPrice] = useState('')
    const [page, setPage] = useState(1)
    const [reload, setReload] = useState(0)

    useEffect(() => {
        let active = true
        getLatestLensAnalyses().then((data) => active && setItems(data)).catch((e) => active && setError(e.message)).finally(() => active && setLoading(false))
        return () => { active = false }
    }, [reload])

    const filtered = useMemo(() => {
        const keyword = query.trim().toLowerCase()
        return items.filter((item) => {
            const text = `${item.companyNameKo || ''} ${item.companyNameEn || ''} ${item.ticker || ''}`.toLowerCase()
            const price = number(item.currentPrice)
            return (!keyword || text.includes(keyword)) && (!minPrice || price >= number(minPrice)) && (!maxPrice || price <= number(maxPrice))
        }).sort((a, b) => {
            if (sort === 'name') return (a.companyNameKo || a.companyNameEn || a.ticker).localeCompare(b.companyNameKo || b.companyNameEn || b.ticker, 'ko')
            if (sort === 'volume') return number(b.volume) - number(a.volume)
            if (sort === 'priceAsc') return number(a.currentPrice) - number(b.currentPrice)
            if (sort === 'priceDesc') return number(b.currentPrice) - number(a.currentPrice)
            return number(b.overallScore) - number(a.overallScore)
        })
    }, [items, query, sort, minPrice, maxPrice])
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const updateFilter = (setter) => (event) => { setter(event.target.value); setPage(1) }
    const logout = () => { localStorage.removeItem('accessToken'); setLoggedIn(false); showToast({ title: '로그아웃 완료', message: '안전하게 로그아웃되었습니다.', type: 'info' }) }

    return <main className="today-lens-page">
        <SiteHeader activePage="today-lens" isLoggedIn={loggedIn} onLoginClick={() => navigate('/community', { state: { openLogin: true } })} onLogoutClick={logout} />
        <section className="lens-shell">
            <LensTabs />
            <header className="lens-title"><div><p>DAILY MARKET INTELLIGENCE</p><h1>Today&apos;s <em>Lens.</em></h1></div><span>최신 완료 분석 배치 · 종합점수 기준</span></header>
            <div className="lens-controls">
                <label className="search-field"><span>SEARCH</span><input value={query} onChange={updateFilter(setQuery)} placeholder="회사명 또는 티커 검색" /></label>
                <label><span>SORT BY</span><select value={sort} onChange={updateFilter(setSort)}><option value="score">종합점수순</option><option value="name">이름순</option><option value="volume">거래량순</option><option value="priceAsc">낮은 가격순</option><option value="priceDesc">높은 가격순</option></select></label>
                <label><span>MIN PRICE</span><input type="number" min="0" value={minPrice} onChange={updateFilter(setMinPrice)} placeholder="$ 0" /></label>
                <label><span>MAX PRICE</span><input type="number" min="0" value={maxPrice} onChange={updateFilter(setMaxPrice)} placeholder="$ ∞" /></label>
            </div>
            <AsyncState loading={loading} error={error} empty={!loading && !error && visible.length === 0} onRetry={() => { setLoading(true); setError(''); setReload((v) => v + 1) }} />
            {!loading && !error && <div className="stock-grid">{visible.map((item) => <article className="stock-card" key={item.ticker} onClick={() => navigate(`/stocks/${item.ticker}`)}>
                <div className="stock-card-top"><span>{item.ticker}</span><strong>{number(item.overallScore).toFixed(1)}</strong></div>
                <h2>{item.companyNameKo || item.companyNameEn}</h2><p>{item.companyNameEn}</p>
                <div className="stock-metrics"><span>현재가 <b>{money(item.currentPrice)}</b></span><span>거래량 <b>{number(item.volume).toLocaleString()}</b></span></div>
                {item.analysisSummary && <small>{item.analysisSummary}</small>}
            </article>)}</div>}
            <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} onChange={setPage} />
        </section>
    </main>
}
