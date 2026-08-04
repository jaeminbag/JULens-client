import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './App.jsx'
import PostCreatePage from './pages/PostCreatePage.jsx'
import PostDetailPage from './pages/PostDetailPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import TodayLensPage from './pages/TodayLensPage.jsx'
import { SiteFeedbackProvider } from './components/SiteFeedback.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            {/* useSiteFeedback을 사용하는 모든 페이지의 바깥을 감싼다. */}
            <SiteFeedbackProvider>
                <Routes>
                    {/* 사이트에 처음 들어오면 JULens 소개 랜딩 화면을 표시한다. */}
                    <Route path="/" element={<LandingPage />} />

                    {/* 기존 게시글 목록 기능은 Community 주소에서 그대로 사용한다. */}
                    <Route path="/community" element={<App />} />

                    {/* 분석 기능이 완성되기 전까지 제품 방향을 보여주는 준비 화면이다. */}
                    <Route path="/today-lens" element={<TodayLensPage />} />

                    <Route
                        path="/posts/new"
                        element={<PostCreatePage />}
                    />

                    <Route
                        path="/posts/:postId/edit"
                        element={<PostCreatePage mode="edit" />}
                    />

                    <Route
                        path="/posts/:postId"
                        element={<PostDetailPage />}
                    />
                </Routes>
            </SiteFeedbackProvider>
        </BrowserRouter>
    </StrictMode>,
)
