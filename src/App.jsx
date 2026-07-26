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

  const sortedPosts =
      activeTab === 'popular'
          ? [...posts].sort((a, b) => b.likes - a.likes)
          : posts

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

          <button className="login-button" type="button">
            Log in
          </button>
        </header>

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