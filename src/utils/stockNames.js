const normalizeName = (name) => typeof name === 'string' ? name.trim() : ''
const containsHangul = (name) => /[가-힣]/.test(name)

export const getStockDisplayNames = (stock = {}) => {
    const englishName = normalizeName(stock.companyName)
    const koreanName = normalizeName(stock.companyNameKr)
    const hasKoreanName = containsHangul(koreanName)

    return {
        primaryName: hasKoreanName ? koreanName : (englishName || koreanName || stock.ticker || '종목명 없음'),
        secondaryName: hasKoreanName && englishName ? englishName : '',
    }
}
