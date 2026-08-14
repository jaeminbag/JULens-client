import { useEffect, useState } from 'react'
import { getUsdKrwExchangeRate } from '../api/lens.js'

/** 서버가 캐시한 일일 기준환율을 한 번 받아 모든 달러 가격에 함께 표시한다. */
export const useUsdKrwRate = () => {
    const [exchangeRate, setExchangeRate] = useState(null)

    useEffect(() => {
        let active = true
        getUsdKrwExchangeRate()
            .then((response) => {
                const rate = Number(response?.rate)
                if (active && Number.isFinite(rate) && rate > 0) setExchangeRate(rate)
            })
            .catch(() => {
                if (active) setExchangeRate(null)
            })
        return () => { active = false }
    }, [])

    return exchangeRate
}
