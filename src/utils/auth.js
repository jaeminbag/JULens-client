// JWT payload의 sub에서 현재 로그인한 사용자 ID를 가져온다.
export const getLoggedInUserId = () => {
    const accessToken = localStorage.getItem('accessToken')

    if (!accessToken) {
        return null
    }

    try {
        // JWT는 header.payload.signature 구조이므로 가운데 payload를 가져온다.
        const payloadPart = accessToken.split('.')[1]

        if (!payloadPart) {
            return null
        }

        // JWT의 Base64 URL 형식을 브라우저가 해석할 수 있는 Base64로 변환한다.
        const normalizedPayload = payloadPart
            .replace(/-/g, '+')
            .replace(/_/g, '/')

        const paddedPayload = normalizedPayload.padEnd(
            Math.ceil(normalizedPayload.length / 4) * 4,
            '=',
        )

        const payload = JSON.parse(atob(paddedPayload))
        const userId = Number(payload.sub)

        // 백엔드가 JWT subject에 저장한 userId만 반환한다.
        return Number.isInteger(userId) ? userId : null
    } catch {
        // 토큰 형식이 잘못됐으면 로그인 사용자 ID를 확인할 수 없는 것으로 처리한다.
        return null
    }
}