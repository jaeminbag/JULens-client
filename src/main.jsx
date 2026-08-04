import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './App.jsx'
import PostCreatePage from './pages/PostCreatePage.jsx'
import PostDetailPage from './pages/PostDetailPage.jsx'
import { SiteFeedbackProvider } from './components/SiteFeedback.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            {/* useSiteFeedback을 사용하는 모든 페이지의 바깥을 감싼다. */}
            <SiteFeedbackProvider>
                <Routes>
                    <Route path="/" element={<App />} />

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