import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader.jsx'
import { useSiteFeedback } from '../components/SiteFeedback.jsx'
import './LandingPage.css'

// 랜딩 화면에서만 사용하는 서비스 미리보기 데이터다.
// Today's Lens API가 완성되면 이 배열 대신 서버 응답을 연결한다.
const lensPreviewStocks = [
    {
        rank: '01',
        ticker: 'NVDA',
        company: 'NVIDIA',
        changeRate: '+4.82%',
        score: 92,
        signal: '강한 신호',
    },
    {
        rank: '02',
        ticker: 'MU',
        company: 'Micron Technology',
        changeRate: '+3.14%',
        score: 86,
        signal: '관심 종목',
    },
    {
        rank: '03',
        ticker: 'PLTR',
        company: 'Palantir',
        changeRate: '+2.41%',
        score: 79,
        signal: '관심 종목',
    },
]

const communityPreviewPosts = [
    {
        tag: 'MARKET VIEW',
        title: '실적 이후에도 거래량이 유지되는 종목들',
        author: '@signal_reader',
        likes: 24,
        comments: 8,
    },
    {
        tag: 'RISK CHECK',
        title: '급등 뉴스만 볼 때 놓치기 쉬운 세 가지 신호',
        author: '@quiet_alpha',
        likes: 18,
        comments: 11,
    },
    {
        tag: 'TODAY',
        title: '오늘 프리마켓에서 같이 봐야 할 흐름',
        author: '@lens_daily',
        likes: 13,
        comments: 5,
    },
]

// JWT의 만료 시각을 확인해 랜딩 헤더의 로그인 상태를 결정한다.
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

function LandingPage() {
    const navigate = useNavigate()
    const { showToast } = useSiteFeedback()
    const [isLoggedIn, setIsLoggedIn] = useState(hasValidAccessToken)

    useEffect(() => {
        // 화면에 들어온 섹션에 is-visible을 붙여 스크롤 애니메이션을 실행한다.
        const revealElements = document.querySelectorAll('[data-reveal]')
        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches

        if (prefersReducedMotion) {
            revealElements.forEach((element) =>
                element.classList.add('is-visible'),
            )
            return undefined
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return
                    }

                    entry.target.classList.add('is-visible')
                    observer.unobserve(entry.target)
                })
            },
            {
                threshold: 0.16,
                rootMargin: '0px 0px -60px',
            },
        )

        revealElements.forEach((element) => observer.observe(element))

        return () => observer.disconnect()
    }, [])

    // 랜딩의 로그인 버튼은 Community로 이동하면서 인증 모달을 열게 한다.
    const handleLoginClick = () => {
        navigate('/community', {
            state: {
                openLogin: true,
            },
        })
    }

    // 어느 페이지에서 로그아웃하더라도 같은 JWT를 삭제한다.
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
        <main className="landing-page">
            <SiteHeader
                activePage="about"
                isLoggedIn={isLoggedIn}
                onLoginClick={handleLoginClick}
                onLogoutClick={handleLogoutClick}
            />

            <div className="landing-hero-shell">
                <div className="landing-grid" aria-hidden="true" />
                <div className="landing-glow landing-glow-one" aria-hidden="true" />
                <div className="landing-glow landing-glow-two" aria-hidden="true" />

                <section className="landing-hero">
                    <div className="landing-hero-copy" data-reveal>
                        <p className="landing-kicker">
                            <span /> MARKET INTELLIGENCE, SHARED
                        </p>

                        <h1>
                            Find the signal
                            <br />
                            <em>before the noise.</em>
                        </h1>

                        <p className="landing-hero-description">
                            흩어진 시장 뉴스와 움직임을 하나의 관점으로 읽고,
                            <br />
                            투자자들의 생각까지 함께 확인하는 곳.
                        </p>

                        <div className="landing-hero-actions">
                            <button
                                className="landing-primary-button"
                                type="button"
                                onClick={() => navigate('/today-lens')}
                            >
                                Explore Today&apos;s Lens
                                <span aria-hidden="true">↗</span>
                            </button>

                            <button
                                className="landing-secondary-button"
                                type="button"
                                onClick={() => navigate('/community')}
                            >
                                Join the Community
                            </button>
                        </div>
                    </div>

                    <div className="hero-signal-card" data-reveal aria-label="JULens 신호 미리보기">
                        <div className="hero-signal-topline">
                            <span>LIVE LENS</span>
                            <span className="hero-live-dot">DEMO</span>
                        </div>

                        <div className="hero-signal-score">
                            <span>Signal score</span>
                            <strong>92</strong>
                            <small>/ 100</small>
                        </div>

                        <div className="hero-signal-chart" aria-hidden="true">
                            <span className="bar bar-one" />
                            <span className="bar bar-two" />
                            <span className="bar bar-three" />
                            <span className="bar bar-four" />
                            <span className="bar bar-five" />
                            <span className="bar bar-six" />
                            <i />
                        </div>

                        <div className="hero-signal-footer">
                            <div>
                                <span>TICKER</span>
                                <strong>NVDA</strong>
                            </div>
                            <div>
                                <span>CHANGE</span>
                                <strong>+4.82%</strong>
                            </div>
                            <div>
                                <span>STATUS</span>
                                <strong>STRONG</strong>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="landing-scroll-cue" aria-hidden="true">
                    <span>SCROLL TO READ THE MARKET</span>
                    <i />
                </div>
            </div>

            <section className="landing-noise-section">
                <div className="landing-section-heading" data-reveal>
                    <p>WHY JULENS</p>
                    <h2>
                        The market is loud.
                        <br />
                        <em>Your view shouldn&apos;t be.</em>
                    </h2>
                    <span>
                        JULens는 더 많은 정보를 쌓는 대신,
                        <br />
                        지금 봐야 할 이유를 선명하게 정리합니다.
                    </span>
                </div>

                <div className="landing-feature-grid">
                    <article data-reveal>
                        <span className="feature-number">01</span>
                        <div className="feature-icon">N</div>
                        <h3>News, filtered.</h3>
                        <p>
                            흩어진 뉴스를 나열하지 않고 종목 움직임과 연결해
                            의미 있는 재료를 먼저 봅니다.
                        </p>
                    </article>

                    <article data-reveal>
                        <span className="feature-number">02</span>
                        <div className="feature-icon">S</div>
                        <h3>Signals, scored.</h3>
                        <p>
                            뉴스·등락률·거래량·가격 유지력과 위험 요소를
                            하나의 신호 점수로 정리합니다.
                        </p>
                    </article>

                    <article data-reveal>
                        <span className="feature-number">03</span>
                        <div className="feature-icon">C</div>
                        <h3>Views, shared.</h3>
                        <p>
                            수치만으로 설명되지 않는 시장의 맥락을 다른
                            투자자들의 관점과 함께 읽습니다.
                        </p>
                    </article>
                </div>
            </section>

            <section className="landing-lens-section">
                <div className="landing-section-heading compact" data-reveal>
                    <p>TODAY&apos;S LENS</p>
                    <h2>One screen. The signals that matter.</h2>
                    <span>
                        오늘 움직이는 후보와 그 이유를 한 화면에서 확인합니다.
                    </span>
                </div>

                <div className="lens-browser" data-reveal>
                    <div className="lens-browser-bar">
                        <div className="browser-dots" aria-hidden="true">
                            <span />
                            <span />
                            <span />
                        </div>
                        <span className="browser-address">julens / today&apos;s-lens</span>
                        <span className="browser-demo">UI PREVIEW</span>
                    </div>

                    <div className="lens-dashboard">
                        <aside className="lens-side">
                            <strong>JULENS<span>.</span></strong>
                            <nav>
                                <span className="selected">Today&apos;s Lens</span>
                                <span>Community</span>
                                <span>Watchlist</span>
                            </nav>
                            <small>MARKET STATUS · OPEN</small>
                        </aside>

                        <div className="lens-content">
                            <div className="lens-content-head">
                                <div>
                                    <p>AUG 04 · DEMO DATA</p>
                                    <h3>Today&apos;s strongest signals</h3>
                                </div>
                                <span>3 CANDIDATES</span>
                            </div>

                            <div className="lens-table-head">
                                <span>RANK / COMPANY</span>
                                <span>MOVE</span>
                                <span>SCORE</span>
                                <span>SIGNAL</span>
                            </div>

                            <div className="lens-stock-list">
                                {lensPreviewStocks.map((stock) => (
                                    <article key={stock.ticker}>
                                        <div className="lens-company">
                                            <span>{stock.rank}</span>
                                            <div>
                                                <strong>{stock.ticker}</strong>
                                                <small>{stock.company}</small>
                                            </div>
                                        </div>
                                        <strong className="lens-change">
                                            {stock.changeRate}
                                        </strong>
                                        <div className="lens-score">
                                            <strong>{stock.score}</strong>
                                            <span>
                                                <i style={{ width: `${stock.score}%` }} />
                                            </span>
                                        </div>
                                        <span className="lens-signal">{stock.signal}</span>
                                    </article>
                                ))}
                            </div>

                            <div className="lens-insight">
                                <div>
                                    <span>WHY IT MATTERS</span>
                                    <h4>Volume remains elevated after the news.</h4>
                                    <p>
                                        호재 뉴스 이후에도 상대 거래량과 가격 유지력이
                                        함께 확인되는 흐름입니다.
                                    </p>
                                </div>
                                <div className="insight-metric">
                                    <span>REL. VOLUME</span>
                                    <strong>8.4×</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    className="landing-text-link"
                    type="button"
                    onClick={() => navigate('/today-lens')}
                >
                    See how Today&apos;s Lens works <span>→</span>
                </button>
            </section>

            <section className="landing-community-section">
                <div className="community-copy" data-reveal>
                    <p>COMMUNITY</p>
                    <h2>
                        Numbers move markets.
                        <br />
                        <em>People explain why.</em>
                    </h2>
                    <span>
                        같은 숫자를 보고도 다른 결론에 도달합니다.
                        <br />
                        JULens에서 그 차이를 읽어보세요.
                    </span>
                    <button
                        className="landing-secondary-button"
                        type="button"
                        onClick={() => navigate('/community')}
                    >
                        Explore Community <b>↗</b>
                    </button>
                </div>

                <div className="community-preview" data-reveal>
                    {communityPreviewPosts.map((post, index) => (
                        <article
                            key={post.title}
                            style={{ '--post-index': index }}
                        >
                            <div>
                                <span>{post.tag}</span>
                                <small>JUST NOW</small>
                            </div>
                            <h3>{post.title}</h3>
                            <footer>
                                <span>{post.author}</span>
                                <div>
                                    <span>♡ {post.likes}</span>
                                    <span>◇ {post.comments}</span>
                                </div>
                            </footer>
                        </article>
                    ))}
                </div>
            </section>

            <section className="landing-final-cta" data-reveal>
                <p>YOUR NEXT SIGNAL STARTS HERE</p>
                <h2>
                    Noise out.
                    <br />
                    <em>Signal in.</em>
                </h2>
                <button
                    className="landing-primary-button"
                    type="button"
                    onClick={() => navigate('/community')}
                >
                    Enter JULens <span>↗</span>
                </button>
                <span className="landing-final-mark">JULENS.</span>
            </section>
        </main>
    )
}

export default LandingPage
