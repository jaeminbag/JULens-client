import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStockNews } from '../api/lens.js'
import AsyncState from '../components/AsyncState.jsx'
import LensTabs from '../components/LensTabs.jsx'
import Pagination from '../components/Pagination.jsx'
import SiteHeader from '../components/SiteHeader.jsx'
import { hasValidAccessToken } from '../utils/auth.js'
import './TodayLensPage.css'

const PAGE_SIZE = 8
const formatDate = (value) => value
    ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    : ''

export default function StockNewsPage() {
    const navigate = useNavigate()
    const [result, setResult] = useState({ content: [], totalPages: 0, totalElements: 0 })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [query, setQuery] = useState('')
    const [page, setPage] = useState(1)
    const [reload, setReload] = useState(0)

    useEffect(() => {
        let active = true

        getStockNews({ keyword: query.trim(), page: page - 1, size: PAGE_SIZE }).then((data) => {
            if (active) setResult(data ?? { content: [], totalPages: 0, totalElements: 0 })
        }).catch((requestError) => {
            if (active) setError(requestError.message)
        }).finally(() => {
            if (active) setLoading(false)
        })

        return () => { active = false }
    }, [query, page, reload])

    const items = result.content ?? []
    const totalPages = Math.max(1, result.totalPages ?? 0)
    const changeQuery = (event) => {
        setLoading(true)
        setError('')
        setQuery(event.target.value)
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

    return <main className="today-lens-page">
        <SiteHeader activePage="today-lens" isLoggedIn={hasValidAccessToken()} onLoginClick={() => navigate('/community', { state: { openLogin: true } })} onLogoutClick={() => { localStorage.removeItem('accessToken'); navigate('/') }} />
        <section className="lens-shell">
            <LensTabs />
            <header className="lens-title"><div><p>CURATED MARKET SIGNALS</p><h1>Stock <em>News.</em></h1></div><span>실제 종목 뉴스 · 총 {result.totalElements ?? 0}건</span></header>
            <div className="lens-controls news-search"><label className="search-field"><span>SEARCH NEWS</span><input value={query} onChange={changeQuery} placeholder="제목, 출처, 회사명 또는 티커 검색" /></label></div>
            <AsyncState loading={loading} error={error} empty={!loading && !error && items.length === 0} onRetry={retry} />
            {!loading && !error && <div className="news-list">{items.map((news) => <article key={news.newsId} onClick={() => news.url && window.open(news.url, '_blank', 'noopener,noreferrer')}>
                <div><span>{news.source}</span><time>{formatDate(news.publishedAt)}</time></div>
                <h2>{news.title}</h2><p>{news.summary}</p>
                <footer>{(news.relatedStocks || []).map((stock) => <b key={stock.stockId}>#{stock.ticker}</b>)}<i>원문 보기 ↗</i></footer>
            </article>)}</div>}
            {!loading && !error && items.length > 0 && <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} onChange={changePage} />}
        </section>
    </main>
}
