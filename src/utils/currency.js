export const formatUsd = (value) => value == null || !Number.isFinite(Number(value))
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
    }).format(Number(value))

export const formatKrw = (usdValue, usdKrwRate) => {
    const converted = Number(usdValue) * Number(usdKrwRate)
    if (!Number.isFinite(converted)) return ''
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0,
    }).format(converted)
}
