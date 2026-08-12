const LENS_LABELS = {
    CONDITION_BUY_CANDIDATE: '조건부 매수 후보',
    RISK: '위험 종목',
    WATCH: '관심 종목',
    ALREADY_LATE: '추격 매수 주의',
}

const MARKET_SESSIONS = {
    PRE_MARKET: '프리마켓',
    REGULAR_MARKET: '정규장',
    AFTER_MARKET: '애프터마켓',
}

export const formatLensLabel = (label) => LENS_LABELS[label] || label || '분석 대기'

export const formatMarketSession = (session) => MARKET_SESSIONS[session] || session || '시장 정보 없음'
