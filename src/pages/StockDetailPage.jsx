import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getStockDetail } from '../api/lens.js'
import AsyncState from '../components/AsyncState.jsx'
import SiteHeader from '../components/SiteHeader.jsx'
import { hasValidAccessToken } from '../utils/auth.js'
import './TodayLensPage.css'

export default function StockDetailPage() {
    const { ticker } = useParams(); const navigate = useNavigate(); const [stock, setStock] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [reload, setReload] = useState(0)
    useEffect(() => { let active = true; getStockDetail(ticker).then((v) => active && setStock(v)).catch((e) => active && setError(e.message)).finally(() => active && setLoading(false)); return () => { active = false } }, [ticker, reload])
    return <main className="today-lens-page"><SiteHeader activePage="today-lens" isLoggedIn={hasValidAccessToken()} onLoginClick={() => navigate('/community', { state: { openLogin: true } })} onLogoutClick={() => { localStorage.removeItem('accessToken'); navigate('/') }} /><section className="lens-shell stock-detail"><button className="back" onClick={() => navigate(-1)}>← 목록으로</button><AsyncState loading={loading} error={error} onRetry={() => { setLoading(true); setError(''); setReload((v) => v + 1) }} />{stock && !loading && !error && <><header><span>{stock.ticker}</span><h1>{stock.companyNameKo || stock.companyNameEn}</h1><p>{stock.companyNameEn}</p></header><div className="detail-metrics"><article><span>현재가</span><b>${Number(stock.currentPrice).toLocaleString()}</b></article><article><span>등락률</span><b>{stock.changeRate}%</b></article><article><span>종합점수</span><b>{stock.overallScore}</b></article><article><span>거래량</span><b>{Number(stock.volume || 0).toLocaleString()}</b></article></div><article className="analysis-panel"><span>LATEST LENS ANALYSIS</span><h2>최신 분석</h2><p>{stock.latestAnalysisSummary || stock.analysisSummary || stock.analysis || '제공된 분석 내용이 없습니다.'}</p></article></>}</section></main>
}
