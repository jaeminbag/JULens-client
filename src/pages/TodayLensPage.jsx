import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader.jsx'
import { useSiteFeedback } from '../components/SiteFeedback.jsx'
import './TodayLensPage.css'

// 저장된 JWT의 존재와 만료 시각을 확인한다.
const hasValidAccessToken = () => {
    const accessToken = localStorage.getItem('accessToken')

    if (!accessToken) {
        return false
    }

    try {
        const payloadPart = accessToken.split('.')[1]
        const normalizedPayload = payloadPart
            .replace(/-/g, '+')
            .replace(/_/g, '/')
            .padEnd(Math.ceil(payloadPart.length / 4) * 4, '=')
        const payload = JSON.parse(atob(normalizedPayload))

        return Date.now() < payload.exp * 1000
    } catch {
        return false
    }
}

function TodayLensPage() {
    const navigate = useNavigate()
    const { showToast } = useSiteFeedback()
    const [isLoggedIn, setIsLoggedIn] = useState(hasValidAccessToken)

    const handleLoginClick = () => {
        navigate('/community', {
            state: {
                openLogin: true,
            },
        })
    }

    const handleLogoutClick = () => {
        localStorage.removeItem('accessToken')
        setIsLoggedIn(false)

        showToast({
            title: '로그아웃 완료',
            message: '안전하게 로그아웃되었습니다.',
            type: 'info',
        })
    }

    return (
        <main className="today-lens-page">
            <SiteHeader
                activePage="today-lens"
                isLoggedIn={isLoggedIn}
                onLoginClick={handleLoginClick}
                onLogoutClick={handleLogoutClick}
            />

            <section className="today-lens-coming-soon">
                <p>TODAY&apos;S LENS · IN DEVELOPMENT</p>
                <h1>
                    Today&apos;s market,
                    <br />
                    <em>through one lens.</em>
                </h1>
                <span>
                    뉴스, 움직임, 거래량과 위험 신호를 연결한 오늘의 후보 화면을
                    준비하고 있습니다.
                </span>

                <div className="today-lens-progress" aria-label="Today's Lens 개발 진행 상태">
                    <i />
                    <strong>CORE ENGINE IN PROGRESS</strong>
                    <span>01 / 03</span>
                </div>

                <button type="button" onClick={() => navigate('/community')}>
                    Community 먼저 둘러보기 <b>↗</b>
                </button>
            </section>
        </main>
    )
}

export default TodayLensPage
