import { useId } from 'react'
import RealtimeFeedBadge from './RealtimeFeedBadge.jsx'
import DualPrice from './DualPrice.jsx'
import { getRealtimeFeedLabel } from '../utils/realtimeFeeds.js'
import { formatUsd } from '../utils/currency.js'

const WIDTH = 720
const HEIGHT = 260
const PADDING = 12

const PRICE_PERIODS = [
    ['REALTIME', '실시간'],
    ['ONE_DAY', '1일'],
    ['ONE_WEEK', '1주'],
    ['THREE_MONTHS', '3달'],
    ['ONE_YEAR', '1년'],
]

const PERIOD_DESCRIPTIONS = {
    REALTIME: '현재 세션 · 실시간 가격 반영',
    ONE_DAY: '최근 완료 거래일 · 분봉',
    ONE_WEEK: '최근 1주 · 시간봉',
    THREE_MONTHS: '최근 3개월 · 일봉',
    ONE_YEAR: '최근 1년 · 일봉',
}

const formatChartDate = (timestamp, period) => {
    if (!timestamp) return '—'
    const options = ['REALTIME', 'ONE_DAY', 'ONE_WEEK'].includes(period)
        ? { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        : { year: 'numeric', month: 'short', day: 'numeric' }
    return new Intl.DateTimeFormat('ko-KR', {
        ...options,
        timeZone: 'Asia/Seoul',
    }).format(new Date(timestamp))
}

export default function PriceLineChart({
    points = [],
    compact = false,
    feed = '',
    exchangeRate = null,
    period = 'REALTIME',
    onPeriodChange,
    windowStart = null,
    windowEnd = null,
    loading = false,
    currentPrice = null,
}) {
    const gradientId = `price-chart-${useId().replace(/:/g, '')}`
    const validPoints = points
        .map((point) => ({ ...point, price: Number(point.price) }))
        .filter((point) => point.timestamp && Number.isFinite(point.price))
    const firstPoint = validPoints[0]
    const lastPoint = validPoints.at(-1)

    if (validPoints.length < 2) {
        if (compact) return <div className="mini-chart-empty">가격 이력 준비 중</div>
        return <section className="price-chart-panel empty">
            <ChartHeader
                lastPrice={period === 'REALTIME' ? currentPrice ?? lastPoint?.price : lastPoint?.price}
                changeRate={0}
                feed={feed}
                exchangeRate={exchangeRate}
            />
            <PeriodTabs period={period} onPeriodChange={onPeriodChange} />
            <p>{loading ? '가격 추이를 불러오는 중입니다.' : '선택한 기간에 표시할 가격 이력이 아직 없습니다.'}</p>
        </section>
    }

    const prices = validPoints.map((point) => point.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = Math.max(maxPrice - minPrice, maxPrice * 0.005, 0.01)
    const xStep = (WIDTH - PADDING * 2) / (validPoints.length - 1)
    const coordinates = validPoints.map((point, index) => ({
        x: PADDING + index * xStep,
        y: PADDING + ((maxPrice - point.price) / priceRange) * (HEIGHT - PADDING * 2),
    }))
    const linePath = coordinates
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
        .join(' ')
    const areaPath = `${linePath} L ${coordinates.at(-1).x} ${HEIGHT} L ${coordinates[0].x} ${HEIGHT} Z`
    const rising = lastPoint.price >= firstPoint.price
    const changeRate = firstPoint.price === 0
        ? 0
        : ((lastPoint.price - firstPoint.price) / firstPoint.price) * 100
    const color = rising ? '#c8ff3d' : '#ff7777'
    const displayStart = windowStart ?? firstPoint.timestamp
    const displayEnd = windowEnd ?? lastPoint.timestamp

    return <section className={`price-chart-panel ${compact ? 'compact' : ''} ${rising ? 'rising' : 'falling'}`}>
        {!compact && <>
            <ChartHeader
                lastPrice={period === 'REALTIME' ? currentPrice ?? lastPoint.price : lastPoint.price}
                changeRate={changeRate}
                feed={feed}
                exchangeRate={exchangeRate}
            />
            <PeriodTabs period={period} onPeriodChange={onPeriodChange} />
        </>}
        <div className="price-chart-canvas">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role={compact ? undefined : 'img'} aria-label={compact ? undefined : `${formatUsd(firstPoint.price)}에서 ${formatUsd(lastPoint.price)}까지의 가격 선 그래프`}>
                <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.24"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
                {!compact && <><line className="chart-guide" x1="0" y1="65" x2={WIDTH} y2="65"/><line className="chart-guide" x1="0" y1="130" x2={WIDTH} y2="130"/><line className="chart-guide" x1="0" y1="195" x2={WIDTH} y2="195"/></>}
                <path d={areaPath} fill={`url(#${gradientId})`}/>
                <path className="price-chart-line" d={linePath} stroke={color}/>
                {!compact && <circle cx={coordinates.at(-1).x} cy={coordinates.at(-1).y} r="5" fill={color}/>
                }
            </svg>
        </div>
        {!compact && <footer>
            <span>{formatChartDate(displayStart, period)}</span>
            <b>{feed && period === 'REALTIME' ? getRealtimeFeedLabel(feed) : PERIOD_DESCRIPTIONS[period]}</b>
            <span>{formatChartDate(displayEnd, period)}</span>
        </footer>}
    </section>
}

function ChartHeader({ lastPrice, changeRate, feed, exchangeRate }) {
    return <header>
        <div><span>PRICE TREND</span><h2>가격 추이</h2></div>
        {lastPrice != null && <div className="chart-current-price">
            <DualPrice value={lastPrice} exchangeRate={exchangeRate} />
            <b>{changeRate >= 0 ? '+' : ''}{changeRate.toFixed(2)}%</b>
            <RealtimeFeedBadge feed={feed} />
        </div>}
    </header>
}

function PeriodTabs({ period, onPeriodChange }) {
    return <nav className="price-period-tabs" aria-label="가격 추이 기간">
        {PRICE_PERIODS.map(([value, label]) => <button
            key={value}
            type="button"
            className={period === value ? 'active' : ''}
            onClick={() => onPeriodChange?.(value)}
        >{label}</button>)}
    </nav>
}
