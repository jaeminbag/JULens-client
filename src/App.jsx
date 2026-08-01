import { useState } from 'react'
import './App.css'

const posts = [
  {
    id: 1,
    tag: 'MARKET',
    title: '실적 발표 이후 거래량이 급증한 종목, 지금 들어가도 될까?',
    content: '장 초반부터 평소보다 큰 거래량이 붙었는데 윗꼬리가 조금 신경 쓰입니다.',
    author: 'JULens',
    time: '12분 전',
    likes: 24,
    comments: 8,
  },
  {
    id: 2,
    tag: 'TECH',
    title: 'AI 서버 수요가 이어질 때 다음으로 볼 섹터',
    content: '반도체만 보지 말고 전력 인프라와 냉각 쪽도 같이 봐야 할 것 같아요.',
    author: 'minseo',
    time: '38분 전',
    likes: 16,
    comments: 5,
  },
  {
    id: 3,
    tag: 'WATCH',
    title: '오늘 급등주는 재료보다 거래량을 먼저 봐야 하는 이유',
    content: '뉴스가 좋아도 거래대금이 받쳐주지 않으면 진입 타이밍이 애매합니다.',
    author: 'stocklog',
    time: '1시간 전',
    likes: 11,
    comments: 3,
  },
]
function App() {
  const [activeTab, setActiveTab] = useState('latest')

  // 로그인 모달이 열려 있는지를 관리한다.
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  // 로그인 폼에 입력된 이메일과 비밀번호를 관리한다.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // 로그인 실패 메시지와 요청 진행 상태를 관리한다.
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const sortedPosts =
    activeTab === 'popular'
      ? [...posts].sort((a, b) => b.likes - a.likes)
      : posts

  // 로그인 버튼을 눌렀을 때 이전 오류를 지우고 모달을 연다.
  const openLoginModal = () => {
    setLoginError('')
    setIsLoginOpen(true)
  }

  // 로그인 모달을 닫고 기존 오류 메시지를 지운다.
  const closeLoginModal = () => {
    setIsLoginOpen(false)
    setLoginError('')
  }

  // 로그인 폼을 제출하면 백엔드 로그인 API를 호출한다.
  const handleLogin = async (event) => {
    // form의 기본 동작인 페이지 새로고침을 막는다.
    event.preventDefault()

    setLoginError('')
    setIsLoggingIn(true)

    try {
      const response = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: {
          // 요청 본문이 JSON 형식이라는 것을 백엔드에 알려준다.
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      // 백엔드의 ApiResponse<LoginResponse>를 JSON으로 변환한다.
      const result = await response.json()

      // HTTP 오류와 ApiResponse의 실패 결과를 모두 검사한다.
      if (!response.ok || !result.success) {
        throw new Error(result.message || '로그인에 실패했습니다.')
      }

      // 실제 JWT는 ApiResponse의 data 안에 들어 있다.
      const accessToken = result.data?.accessToken

      if (!accessToken) {
        throw new Error('로그인 응답에 accessToken이 없습니다.')
      }

      // 이후 GET /posts 같은 인증 API 요청에서 사용할 JWT를 저장한다.
      localStorage.setItem('accessToken', accessToken)

      setIsLoginOpen(false)
      setPassword('')

      alert(`${result.data.nickname}님, 로그인되었습니다.`)
    } catch (error) {
      // fetch 자체가 실패했다면 서버가 꺼졌거나 연결되지 않은 경우일 가능성이 크다.
      if (error instanceof TypeError) {
        setLoginError(
          '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.',
        )
      } else {
        setLoginError(
          error instanceof Error
            ? error.message
            : '로그인 중 알 수 없는 오류가 발생했습니다.',
        )
      }
    } finally {
      // 성공과 실패 여부와 관계없이 요청 진행 상태를 종료한다.
      setIsLoggingIn(false)
    }
  }

  return (
    <main className="app">
      <header className="header">
        <button className="logo" type="button">
          JULENS<span>.</span>
        </button>

        <nav>
          <button className="nav-link active" type="button">
            Community
          </button>
          <button className="nav-link" type="button">
            Today&apos;s Lens
          </button>
        </nav>

        <button
          className="login-button"
          type="button"
          onClick={openLoginModal}
        >
          Log in
        </button>
      </header>

      {/* isLoginOpen이 true일 때만 로그인 모달을 화면에 표시한다. */}
      {isLoginOpen && (
        <div
          className="login-overlay"
          onClick={(event) => {
            // 모달 바깥의 어두운 영역을 눌렀을 때만 닫는다.
            if (event.target === event.currentTarget) {
              closeLoginModal()
            }
          }}
        >
          <section
            className="login-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
          >
            <div className="login-modal-header">
              <div>
                <p className="login-modal-label">WELCOME BACK</p>
                <h2 id="login-title">Log in</h2>
              </div>

              <button
                className="login-close-button"
                type="button"
                aria-label="로그인 창 닫기"
                onClick={closeLoginModal}
              >
                ×
              </button>
            </div>

            {/* 제출 버튼 클릭과 Enter 입력 모두 handleLogin으로 처리된다. */}
            <form className="login-form" onSubmit={handleLogin}>
              <label className="login-field" htmlFor="login-email">
                <span>Email</span>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  maxLength={30}
                  autoComplete="email"
                  placeholder="이메일을 입력해주세요"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              <label className="login-field" htmlFor="login-password">
                <span>Password</span>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  minLength={10}
                  maxLength={20}
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력해주세요"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>

              {/* 로그인 실패 시에만 백엔드 오류 메시지를 출력한다. */}
              {loginError && (
                <p className="login-error" role="alert">
                  {loginError}
                </p>
              )}

              <button
                className="login-submit-button"
                type="submit"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Logging in...' : 'Log in'}
              </button>
            </form>
          </section>
        </div>
      )}

      <section className="hero-section">
        <p className="eyebrow">MARKET COMMUNITY</p>
        <h1>
          Noise out.
          <br />
          <em>Signal in.</em>
        </h1>
        <p className="hero-description">
          시장의 움직임을 함께 읽고,
          <br />
          더 나은 투자 관점을 쌓아가는 커뮤니티.
        </p>
      </section>

      <section className="feed-section">
        <div className="feed-header">
          <div>
            <p className="section-label">COMMUNITY FEED</p>
            <h2>게시글</h2>
          </div>

          <button className="write-button" type="button">
            + 글쓰기
          </button>
        </div>

        <div className="tabs">
          <button
            className={activeTab === 'latest' ? 'tab selected' : 'tab'}
            type="button"
            onClick={() => setActiveTab('latest')}
          >
            최신글
          </button>
          <button
            className={activeTab === 'popular' ? 'tab selected' : 'tab'}
            type="button"
            onClick={() => setActiveTab('popular')}
          >
            인기글
          </button>
        </div>

        <div className="post-list">
          {sortedPosts.map((post) => (
            <article className="post-card" key={post.id}>
              <div className="post-top">
                <span className="tag">{post.tag}</span>
                <span className="time">{post.time}</span>
              </div>

              <h3>{post.title}</h3>
              <p>{post.content}</p>

              <div className="post-bottom">
                <span>@{post.author}</span>
                <div className="post-stats">
                  <span>♡ {post.likes}</span>
                  <span>◌ {post.comments}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App