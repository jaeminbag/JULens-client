import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStockNews } from '../api/lens.js'
import AsyncState from '../components/AsyncState.jsx'
import LensTabs from '../components/LensTabs.jsx'
import Pagination from '../components/Pagination.jsx'
import SiteHeader from '../components/SiteHeader.jsx'
import { hasValidAccessToken } from '../utils/auth.js'
import './TodayLensPage.css'

const PAGE_SIZE = 8
const formatDate = (value) => value ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : ''

export default function StockNewsPage() {
    const navigate = useNavigate(); const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [query, setQuery] = useState(''); const [page, setPage] = useState(1); const [reload, setReload] = useState(0)
    useEffect(() => { let active = true; getStockNews().then((v) => active && setItems(v)).catch((e) => active && setError(e.message)).finally(() => active && setLoading(false)); return () => { active = false } }, [reload])
    const filtered = useMemo(() => items.filter((n) => `${n.title || ''} ${n.summary || ''} ${n.source || ''}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)), [items, query])
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)); const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    return <main className="today-lens-page"><SiteHeader activePage="today-lens" isLoggedIn={hasValidAccessToken()} onLoginClick={() => navigate('/community', { state: { openLogin: true } })} onLogoutClick={() => { localStorage.removeItem('accessToken'); navigate('/') }} /><section className="lens-shell"><LensTabs /><header className="lens-title"><div><p>CURATED MARKET SIGNALS</p><h1>Stock <em>News.</em></h1></div><span>시장 관련 최신 뉴스</span></header><div className="lens-controls news-search"><label className="search-field"><span>SEARCH NEWS</span><input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder="제목, 요약, 출처 검색" /></label></div><AsyncState loading={loading} error={error} empty={!loading && !error && !visible.length} onRetry={() => { setLoading(true); setError(''); setReload((v) => v + 1) }} />
        {!loading && !error && <div className="news-list">{visible.map((news, i) => <article key={news.id || `${news.title}-${i}`} onClick={() => news.originalUrl && window.open(news.originalUrl, '_blank', 'noopener,noreferrer')}><div><span>{news.source}</span><time>{formatDate(news.publishedAt)}</time></div><h2>{news.title}</h2><p>{news.summary}</p><footer>{(news.relatedStocks || []).map((stock) => <b key={typeof stock === 'string' ? stock : stock.ticker}>#{typeof stock === 'string' ? stock : stock.ticker}</b>)}<i>원문 보기 ↗</i></footer></article>)}</div>}<Pagination page={Math.min(page, pages)} totalPages={pages} onChange={setPage} /></section></main>
}
