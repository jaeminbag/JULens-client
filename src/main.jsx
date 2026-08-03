import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import PostDetailPage from './pages/PostDetailPage.jsx'
import './index.css'
import App from './App.jsx'
import PostCreatePage from './pages/PostCreatePage.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        {/* 현재 주소에 맞는 페이지를 표시한다. */}
        <BrowserRouter>
            <Routes>
                {/* 메인 게시글 목록 페이지 */}
                <Route path="/" element={<App />} />

                {/* 게시글 작성 전용 페이지 */}
                <Route path="/posts/new" element={<PostCreatePage />} />

                {/* 게시글 번호에 해당하는 단건 상세 페이지 */}
                <Route path="/posts/:postId" element={<PostDetailPage />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>,
)