const normalizeName = (name) => typeof name === 'string' ? name.trim() : ''

export const getStockDisplayNames = (stock = {}) => {
    const englishName = normalizeName(stock.companyName)
    const koreanName = normalizeName(stock.companyNameKr)
    const primaryName = koreanName || englishName || stock.ticker || '종목명 없음'
    const hasDifferentEnglishName = englishName
        && primaryName.localeCompare(englishName, undefined, { sensitivity: 'base' }) !== 0

    return {
        // 백엔드가 검증한 짧은 표기(AMD, AT&T 등)는 한글 포함 여부와 무관하게 우선한다.
        primaryName,
        secondaryName: hasDifferentEnglishName ? englishName : '',
    }
}
