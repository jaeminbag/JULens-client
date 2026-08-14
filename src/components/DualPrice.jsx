import { formatKrw, formatUsd } from '../utils/currency.js'

export default function DualPrice({ value, exchangeRate, className = '' }) {
    const numericValue = Number(value)
    const hasPrice = value != null && Number.isFinite(numericValue)
    const primaryPrice = exchangeRate && hasPrice
        ? formatKrw(numericValue, exchangeRate)
        : formatUsd(value)
    const secondaryPrice = exchangeRate && hasPrice
        ? formatUsd(numericValue)
        : ''

    return <span className={`dual-price ${className}`.trim()}>
        <strong className="price-number-viewport">
            <span
                key={`primary-${primaryPrice}`}
                className="price-number-tick"
            >{primaryPrice}</span>
        </strong>
        {secondaryPrice && <small className="price-number-viewport">
            <span
                key={`secondary-${secondaryPrice}`}
                className="price-number-tick"
            >{secondaryPrice}</span>
        </small>}
    </span>
}
