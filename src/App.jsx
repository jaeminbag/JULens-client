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

// JWT에 저장된 exp를 확인하여 현재 사용할 수 있는 토큰인지 검사한다.
const isAccessTokenValid = (token) => {
  if (!token) {
    return false
  }

  try {
    // JWT는 header.payload.signature 구조이므로 가운데 payload를 꺼낸다.
    const payloadPart = token.split('.')[1]

    // Base64 URL 형식을 브라우저의 atob()가 읽을 수 있도록 변환한다.
    const base64 = payloadPart
        .replace(/-/g, '+')
        .replace(/_/g, '/')

    // JWT payload를 객체로 변환한다.
    const payload = JSON.parse(atob(base64))

    // JWT의 exp는 초 단위이고 Date.now()는 밀리초 단위이므로 환산한다.
    const expirationTime = payload.exp * 1000

    // 현재 시각이 만료 시각 전이면 유효한 토큰이다.
    return Date.now() < expirationTime
  } catch (error) {
    // JWT 형식이 잘못된 경우도 비로그인 상태로 처리한다.
    return false
  }
}
function App() {
  const [activeTab, setActiveTab] = useState('latest')

  // 로그인·회원가입 모달이 열려 있는지를 관리한다.
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  // 현재 모달이 로그인 화면인지 회원가입 화면인지 구분한다.
  const [authMode, setAuthMode] = useState('login')

  // 로그인과 회원가입에서 공통으로 사용하는 입력값이다.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // 닉네임은 회원가입 요청에서만 사용한다.
  const [nickname, setNickname] = useState('')

  // 로그인 실패 메시지와 로그인 요청 진행 상태를 관리한다.
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // 회원가입 실패 메시지와 회원가입 요청 진행 상태를 별도로 관리한다.
  const [signUpError, setSignUpError] = useState('')
  const [isSigningUp, setIsSigningUp] = useState(false)

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // 브라우저에 저장된 JWT를 가져온다.
    const accessToken = localStorage.getItem('accessToken')

    // JWT가 없거나 이미 만료됐다면 저장소에서도 삭제한다.
    if (!isAccessTokenValid(accessToken)) {
      localStorage.removeItem('accessToken')
      return false
    }

    // 유효한 JWT가 있을 때만 로그인 상태로 시작한다.
    return true
  })

  const sortedPosts =
    activeTab === 'popular'
      ? [...posts].sort((a, b) => b.likes - a.likes)
      : posts

    // 현재 인증 화면에 맞는 오류와 요청 상태를 계산한다.
  // 별도의 state가 아니라 기존 state에서 매 렌더링마다 계산되는 값이다.
  const isLoginMode = authMode === 'login'

  const authError = isLoginMode ? loginError : signUpError

  const isAuthSubmitting = isLoginMode ? isLoggingIn : isSigningUp    
 
  // 헤더의 Log in 버튼을 누르면 항상 로그인 화면으로 모달을 연다.
  const openLoginModal = () => {
    setAuthMode('login')
    setLoginError('')
    setSignUpError('')
    setIsLoginOpen(true)
  }

  // 모달을 닫을 때 입력값과 오류를 모두 초기화한다.
  const closeLoginModal = () => {
    setIsLoginOpen(false)
    setEmail('')
    setPassword('')
    setNickname('')
    setLoginError('')
    setSignUpError('')
  }

  // 로그인과 회원가입 화면을 전환하고 이전 오류를 지운다.
  const changeAuthMode = (nextMode) => {
    setAuthMode(nextMode)
    setLoginError('')
    setSignUpError('')
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
      setIsLoggedIn(true)

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

  // 저장된 JWT를 삭제하고 비로그인 상태로 변경한다.
  const handleLogout = () => {
    // 브라우저에 저장된 JWT를 삭제한다.
    localStorage.removeItem('accessToken')

    // React 화면을 비로그인 상태로 변경한다.
    setIsLoggedIn(false)

    // 로그인·회원가입 입력값과 오류 메시지를 초기화한다.
    setEmail('')
    setPassword('')
    setNickname('')
    setLoginError('')
    setSignUpError('')

    alert('로그아웃되었습니다.')
  }

    // 회원가입 폼을 제출하면 백엔드 회원가입 API를 호출한다.
  const handleSignUp = async (event) => {
    // form 제출로 페이지가 새로고침되는 것을 막는다.
    event.preventDefault()

    setSignUpError('')
    setIsSigningUp(true)

    try {
      const response = await fetch('http://localhost:8080/auth/signup', {
        method: 'POST',
        headers: {
          // 요청 본문이 JSON 형식임을 백엔드에 알려준다.
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          nickname,
        }),
      })

      // ApiResponse<SignUpResponse>를 자바스크립트 객체로 변환한다.
      const result = await response.json()

      // HTTP 오류와 JULens 공통 응답의 실패 여부를 함께 검사한다.
      if (!response.ok || !result.success) {
        throw new Error(result.message || '회원가입에 실패했습니다.')
      }

      // 회원가입 응답에는 JWT가 없으므로 로그인 화면으로만 전환한다.
      // 이메일은 그대로 두고 비밀번호와 닉네임만 초기화한다.
      setAuthMode('login')
      setPassword('')
      setNickname('')
      setSignUpError('')

      alert('회원가입이 완료되었습니다. 방금 만든 계정으로 로그인해주세요.')
    } catch (error) {
      // fetch 요청 자체가 실패한 경우에는 서버 연결 문제로 안내한다.
      if (error instanceof TypeError) {
        setSignUpError(
          '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.',
        )
      } else {
        setSignUpError(
          error instanceof Error
            ? error.message
            : '회원가입 중 알 수 없는 오류가 발생했습니다.',
        )
      }
    } finally {
      // 회원가입 성공·실패와 관계없이 요청 진행 상태를 끝낸다.
      setIsSigningUp(false)
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

        {/* 로그인 상태에 따라 Log out 또는 Log in 버튼을 표시한다. */}
        {isLoggedIn ? (
            <button
                className="login-button"
                type="button"
                onClick={handleLogout}
            >
              Log out
            </button>
        ) : (
            <button
                className="login-button"
                type="button"
                onClick={openLoginModal}
            >
              Log in
            </button>
        )}
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
              aria-labelledby="auth-title"
            >
              <div className="login-modal-header">
                <div>
                  <p className="login-modal-label">
                    {isLoginMode ? 'WELCOME BACK' : 'JOIN JULENS'}
                  </p>
                  <h2 id="auth-title">
                    {isLoginMode ? 'Log in' : 'Sign up'}
                  </h2>
                </div>

                <button
                  className="login-close-button"
                  type="button"
                  aria-label="인증 창 닫기"
                  onClick={closeLoginModal}
                >
                  ×
                </button>
              </div>

              {/* 현재 화면에 따라 로그인 또는 회원가입 함수를 실행한다. */}
              <form
                className="login-form"
                onSubmit={isLoginMode ? handleLogin : handleSignUp}
              >
                {/* 닉네임 입력창은 회원가입 화면에서만 표시한다. */}
                {!isLoginMode && (
                  <label className="login-field" htmlFor="signup-nickname">
                    <span>Nickname</span>
                    <input
                      id="signup-nickname"
                      type="text"
                      value={nickname}
                      minLength={2}
                      maxLength={20}
                      autoComplete="nickname"
                      placeholder="2~20자의 닉네임을 입력해주세요"
                      onChange={(event) => setNickname(event.target.value)}
                      required
                    />
                  </label>
                )}

                <label className="login-field" htmlFor="auth-email">
                  <span>Email</span>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    maxLength={30}
                    autoComplete="email"
                    placeholder="이메일을 입력해주세요"
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </label>

                <label className="login-field" htmlFor="auth-password">
                  <span>Password</span>
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    minLength={10}
                    maxLength={20}
                    autoComplete={
                      isLoginMode ? 'current-password' : 'new-password'
                    }
                    placeholder="10~20자의 비밀번호를 입력해주세요"
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </label>

                {/* 현재 화면에 해당하는 오류만 표시한다. */}
                {authError && (
                  <p className="login-error" role="alert">
                    {authError}
                  </p>
                )}

                <button
                  className="login-submit-button"
                  type="submit"
                  disabled={isAuthSubmitting}
                >
                  {isLoginMode
                    ? isLoggingIn
                      ? 'Logging in...'
                      : 'Log in'
                    : isSigningUp
                      ? 'Signing up...'
                      : 'Sign up'}
                </button>

                <p className="auth-switch">
                  <span>
                    {isLoginMode
                      ? '아직 계정이 없나요?'
                      : '이미 계정이 있나요?'}
                  </span>

                  <button
                    className="auth-switch-button"
                    type="button"
                    disabled={isAuthSubmitting}
                    onClick={() =>
                      changeAuthMode(isLoginMode ? 'signup' : 'login')
                    }
                  >
                    {isLoginMode ? 'Sign up' : 'Log in'}
                  </button>
                </p>
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