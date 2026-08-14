import { formatKrw, formatUsd } from '../utils/currency.js'

export default function DualPrice({ value, exchangeRate, className = '' }) {
    return <span className={`dual-price ${className}`.trim()}>
        <strong>{formatUsd(value)}</strong>
        {exchangeRate && value != null && <small>{formatKrw(value, exchangeRate)}</small>}
    </span>
}
