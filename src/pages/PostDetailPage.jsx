import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './PostDetailPage.css'

// 서버의 작성 시각을 상세 페이지용 날짜 형식으로 변환한다.
const formatPostDate = (createdAt) => {
    const createdDate = new Date(createdAt)

    // 서버 날짜를 변환할 수 없는 경우 날짜를 표시하지 않는다.
    if (Number.isNaN(createdDate.getTime())) {
        return ''
    }

    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(createdDate)
}

function PostDetailPage() {
    // /posts/:postId 주소에서 실제 게시글 번호를 가져온다.
    const { postId } = useParams()
    const navigate = useNavigate()

    // 서버에서 조회한 게시글과 요청 상태를 관리한다.
    const [post, setPost] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchPost = async () => {
            const accessToken = localStorage.getItem('accessToken')

            // 현재 백엔드 게시글 API는 JWT 인증이 필요하다.
            if (!accessToken) {
                setError('게시글을 확인하려면 로그인이 필요합니다.')
                setIsLoading(false)
                return
            }

            try {
                setIsLoading(true)
                setError('')

                // 주소의 postId를 이용해 해당 게시글 한 건만 요청한다.
                const response = await fetch(
                    `http://localhost:8080/posts/${postId}`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    },
                )

                // ApiResponse<PostResponse> 형식의 응답을 변환한다.
                const result = await response.json()

                if (!response.ok || !result.success) {
                    throw new Error(
                        result.message || '게시글을 불러오지 못했습니다.',
                    )
                }

                // 실제 게시글 데이터는 ApiResponse의 data 안에 있다.
                setPost(result.data)
            } catch (requestError) {
                setPost(null)

                if (requestError instanceof TypeError) {
                    setError(
                        '서버에 연결할 수 없습니다. 백엔드 서버를 확인해주세요.',
                    )
                } else {
                    setError(
                        requestError instanceof Error
                            ? requestError.message
                            : '게시글 조회 중 오류가 발생했습니다.',
                    )
                }
            } finally {
                setIsLoading(false)
            }
        }

        fetchPost()
    }, [postId])

    return (
        <main className="post-detail-page">
            <header className="post-detail-header">
                <button
                    className="post-detail-logo"
                    type="button"
                    onClick={() => navigate('/')}
                >
                    JULENS<span>.</span>
                </button>

                <button
                    className="post-detail-back-button"
                    type="button"
                    onClick={() => navigate('/')}
                >
                    ← 목록으로
                </button>
            </header>

            <section className="post-detail-container">
                {isLoading ? (
                    <p className="post-detail-status">
                        게시글을 불러오는 중입니다...
                    </p>
                ) : error ? (
                    <div className="post-detail-error">
                        <span>COMMUNITY SIGNAL · ERROR</span>
                        <h1>{error}</h1>

                        <button type="button" onClick={() => navigate('/')}>
                            목록으로 돌아가기
                        </button>
                    </div>
                ) : (
                    <article className="post-detail-article">
                        <div className="post-detail-top">
                            <span>COMMUNITY SIGNAL</span>
                            <span>{formatPostDate(post.createdAt)}</span>
                        </div>

                        <h1>{post.title}</h1>

                        <div className="post-detail-author">
                            <span>WRITTEN BY</span>
                            <strong>@{post.nickname}</strong>
                        </div>

                        {/* 줄바꿈을 유지하면서 게시글 전체 내용을 표시한다. */}
                        <p className="post-detail-content">
                            {post.content}
                        </p>
                    </article>
                )}
            </section>
        </main>
    )
}

export default PostDetailPage