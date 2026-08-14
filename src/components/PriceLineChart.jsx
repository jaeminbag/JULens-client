import { useId } from 'react'

const WIDTH = 720
const HEIGHT = 260
const PADDING = 12

const formatPrice = (price) => `$${Number(price).toLocaleString('en-US', {
    maximumFractionDigits: 2,
})}`

const formatChartDate = (timestamp, intraday) => new Intl.DateTimeFormat('ko-KR', intraday
    ? { hour: '2-digit', minute: '2-digit' }
    : { month: 'short', day: 'numeric' }).format(new Date(timestamp))

export default function PriceLineChart({ points = [], compact = false, realtime = false }) {
    const gradientId = `price-chart-${useId().replace(/:/g, '')}`
    const validPoints = points
        .map((point) => ({ ...point, price: Number(point.price) }))
        .filter((point) => point.timestamp && Number.isFinite(point.price))

    if (validPoints.length < 2) {
        return compact
            ? <div className="mini-chart-empty">가격 이력 준비 중</div>
            : <section className="price-chart-panel empty"><p>표시할 가격 이력이 아직 없습니다.</p></section>
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
    const firstPoint = validPoints[0]
    const lastPoint = validPoints.at(-1)
    const rising = lastPoint.price >= firstPoint.price
    const changeRate = firstPoint.price === 0
        ? 0
        : ((lastPoint.price - firstPoint.price) / firstPoint.price) * 100
    const timeSpan = new Date(lastPoint.timestamp) - new Date(firstPoint.timestamp)
    const intraday = timeSpan <= 36 * 60 * 60 * 1000
    const color = rising ? '#c8ff3d' : '#ff7777'

    return <section className={`price-chart-panel ${compact ? 'compact' : ''} ${rising ? 'rising' : 'falling'}`}>
        {!compact && <header>
            <div><span>PRICE TREND</span><h2>가격 추이</h2></div>
            <div className="chart-current-price"><strong>{formatPrice(lastPoint.price)}</strong><b>{changeRate >= 0 ? '+' : ''}{changeRate.toFixed(2)}%</b>{realtime && <i className="realtime-badge">IEX 실시간</i>}</div>
        </header>}
        <div className="price-chart-canvas">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role={compact ? undefined : 'img'} aria-label={compact ? undefined : `${formatPrice(firstPoint.price)}에서 ${formatPrice(lastPoint.price)}까지의 가격 선 그래프`}>
                <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.24"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
                {!compact && <><line className="chart-guide" x1="0" y1="65" x2={WIDTH} y2="65"/><line className="chart-guide" x1="0" y1="130" x2={WIDTH} y2="130"/><line className="chart-guide" x1="0" y1="195" x2={WIDTH} y2="195"/></>}
                <path d={areaPath} fill={`url(#${gradientId})`}/>
                <path className="price-chart-line" d={linePath} stroke={color}/>
                {!compact && <circle cx={coordinates.at(-1).x} cy={coordinates.at(-1).y} r="5" fill={color}/>}
            </svg>
        </div>
        {!compact && <footer><span>{formatChartDate(firstPoint.timestamp, intraday)}</span><b>{realtime ? '오늘 · IEX 실시간' : intraday ? '오늘 · 15분 지연' : '최근 거래일'}</b><span>{formatChartDate(lastPoint.timestamp, intraday)}</span></footer>}
    </section>
}
