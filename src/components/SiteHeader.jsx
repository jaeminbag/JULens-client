import { useNavigate } from 'react-router-dom'
import './SiteHeader.css'

// About, Community, Today's Lens가 공통으로 사용하는 상단 헤더다.
function SiteHeader({
    activePage,
    isLoggedIn = false,
    onLoginClick,
    onLogoutClick,
}) {
    const navigate = useNavigate()

    // 현재 페이지와 메뉴가 같을 때만 활성화 스타일을 적용한다.
    const getNavClassName = (pageName) =>
        activePage === pageName ? 'nav-link active' : 'nav-link'

    return (
        <header className="header">
            <button
                className="logo"
                type="button"
                aria-label="JULens 소개 화면으로 이동"
                onClick={() => navigate('/')}
            >
                JULENS<span>.</span>
            </button>

            <nav aria-label="주요 메뉴">
                <button
                    className={getNavClassName('about')}
                    type="button"
                    onClick={() => navigate('/')}
                >
                    About
                </button>

                <button
                    className={getNavClassName('community')}
                    type="button"
                    onClick={() => navigate('/community')}
                >
                    Community
                </button>

                <button
                    className={getNavClassName('today-lens')}
                    type="button"
                    onClick={() => navigate('/today-lens')}
                >
                    Today&apos;s Lens
                </button>
            </nav>

            {/* 로그인 여부에 따라 동일한 위치에서 로그인·로그아웃을 실행한다. */}
            {isLoggedIn ? (
                <button
                    className="login-button"
                    type="button"
                    onClick={onLogoutClick}
                >
                    Log out
                </button>
            ) : (
                <button
                    className="login-button"
                    type="button"
                    onClick={onLoginClick}
                >
                    Log in
                </button>
            )}
        </header>
    )
}

export default SiteHeader
