import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './PostCreatePage.css'

// 본문을 구조적으로 작성할 때 빠르게 삽입할 수 있는 문구다.
const writingPrompts = ['판단 근거', '리스크 요인', '다음 관찰 포인트']

// JULens 커뮤니티의 게시글 작성 전용 페이지다.
function PostCreatePage() {
    const navigate = useNavigate()

    // 게시글 작성 API에 전달할 제목과 내용을 관리한다.
    const [postTitle, setPostTitle] = useState('')
    const [postContent, setPostContent] = useState('')

    // 게시글 등록 요청 중 버튼을 다시 누르지 못하게 관리한다.
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 입력이 끝난 항목 수를 계산해 작성 진행도에 사용한다.
    const completedFieldCount =
        Number(postTitle.trim().length > 0) +
        Number(postContent.trim().length > 0)

    const progressPercentage = completedFieldCount * 50
    const isPostReady = completedFieldCount === 2

    // 아무것도 입력하지 않았을 때 미리보기에 표시할 기본 문구다.
    const previewTitle =
        postTitle.trim() || '아직 제목을 입력하지 않았어요.'

    const previewContent =
        postContent.trim() ||
        '작성 중인 내용이 이곳에 실시간으로 표시됩니다. 관찰한 움직임과 판단 근거를 기록해보세요.'

    // 로고·나가기·취소 버튼을 누르면 메인 페이지로 이동한다.
    const handleCancel = () => {
        navigate('/')
    }

    // 선택한 가이드 제목을 본문에 삽입한다.
    const handlePromptInsert = (prompt) => {
        const spacing = postContent.trim().length > 0 ? '\n\n' : ''

        setPostContent(`${postContent}${spacing}${prompt}\n`)
    }

    // 작성한 제목과 내용을 서버에 전달해 게시글을 등록한다.
    const handleSubmit = async (event) => {
        event.preventDefault()

        const accessToken = localStorage.getItem('accessToken')

        // 로그인 토큰이 없으면 게시글을 작성할 수 없다.
        if (!accessToken) {
            alert('로그인이 필요합니다.')
            navigate('/login')
            return
        }

        try {
            // 요청이 진행되는 동안 등록 버튼을 비활성화한다.
            setIsSubmitting(true)

            const response = await fetch('http://localhost:8080/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },

                // 작성자 정보는 JWT에서 가져오므로 제목과 내용만 전달한다.
                body: JSON.stringify({
                    title: postTitle.trim(),
                    content: postContent.trim(),
                }),
            })

            const result = await response.json()

            // 400, 401, 500 등의 응답은 게시글 등록 실패로 처리한다.
            if (!response.ok) {
                throw new Error(
                    result.message || '게시글 등록에 실패했습니다.',
                )
            }

            alert('게시글이 등록되었습니다.')
            navigate('/')
        } catch (error) {
            alert(error.message)
        } finally {
            // 성공하거나 실패해도 요청 상태를 다시 해제한다.
            setIsSubmitting(false)
        }
    }

    return (
        <main className="post-create-page">
            {/* 배경에 표시되는 JULens 브랜드 워터마크다. */}
            <div className="post-create-background-mark" aria-hidden="true">
                J
            </div>

            <header className="post-create-global-header">
                <button
                    className="post-create-logo"
                    type="button"
                    aria-label="JULens 커뮤니티 메인으로 이동"
                    onClick={handleCancel}
                >
                    JULENS<span>.</span>
                </button>

                <div className="post-create-header-center">
                    <span>COMMUNITY</span>
                    <i aria-hidden="true" />
                    <strong>CREATE SIGNAL</strong>
                </div>

                <button
                    className="post-create-back-button"
                    type="button"
                    onClick={handleCancel}
                >
                    <span>나가기</span>
                    <i aria-hidden="true">×</i>
                </button>
            </header>

            <section className="post-create-workspace">
                <aside className="post-create-side-panel">
                    <div className="post-create-intro">
                        <p className="post-create-eyebrow">
                            <span aria-hidden="true" />
                            NEW COMMUNITY SIGNAL
                        </p>

                        <h1>
                            생각을
                            <br />
                            <em>시그널로.</em>
                        </h1>

                        <p className="post-create-description">
                            시장에서 포착한 작은 움직임도 좋습니다.
                            <br />
                            당신의 관점이 누군가의 다음 시야가 됩니다.
                        </p>
                    </div>

                    {/* 입력한 내용을 실시간으로 확인하는 게시글 미리보기다. */}
                    <article className="post-create-preview">
                        <header className="post-create-preview-header">
                            <span>LIVE PREVIEW</span>

                            <span className="post-create-live-state">
                <i aria-hidden="true" />
                LIVE
              </span>
                        </header>

                        <div className="post-create-preview-body">
              <span className="post-create-preview-tag">
                COMMUNITY
              </span>

                            <h2 className={!postTitle.trim() ? 'is-placeholder' : ''}>
                                {previewTitle}
                            </h2>

                            <p className={!postContent.trim() ? 'is-placeholder' : ''}>
                                {previewContent}
                            </p>
                        </div>

                        <footer className="post-create-preview-footer">
                            <span>YOU</span>
                            <span>JUST NOW</span>
                        </footer>
                    </article>
                </aside>

                <form
                    className="post-create-editor"
                    onSubmit={handleSubmit}
                >
                    <header className="post-create-editor-header">
                        <div>
                            <p>EDITOR / 01</p>
                            <h2>새 게시글 작성</h2>
                        </div>

                        <span
                            className={`post-create-ready-state ${
                                isPostReady ? 'is-ready' : ''
                            }`}
                        >
              <i aria-hidden="true" />

                            {isPostReady
                                ? 'READY TO POST'
                                : 'DRAFT IN PROGRESS'}
            </span>
                    </header>

                    {/* 제목과 내용 입력 상태를 0%, 50%, 100%로 보여준다. */}
                    <div className="post-create-progress">
            <span
                style={{ width: `${progressPercentage}%` }}
            />
                    </div>

                    <div className="post-create-field-block post-create-title-block">
                        <label
                            className="post-create-field-heading"
                            htmlFor="post-title"
                        >
              <span className="post-create-field-number">
                01
              </span>

                            <span>
                <strong>제목</strong>
                <small>한 문장으로 핵심을 보여주세요.</small>
              </span>

                            <em>{postTitle.length} / 100</em>
                        </label>

                        <input
                            id="post-title"
                            type="text"
                            value={postTitle}
                            maxLength={100}
                            autoFocus
                            placeholder="어떤 시그널을 발견했나요?"
                            onChange={(event) =>
                                setPostTitle(event.target.value)
                            }
                            required
                        />
                    </div>

                    <div className="post-create-section-line">
                        <span>WRITE YOUR VIEW</span>
                    </div>

                    <div className="post-create-field-block post-create-content-block">
                        <label
                            className="post-create-field-heading"
                            htmlFor="post-content"
                        >
              <span className="post-create-field-number">
                02
              </span>

                            <span>
                <strong>내용</strong>
                <small>
                  관찰한 사실과 판단 근거를 자유롭게 적어주세요.
                </small>
              </span>

                            <em>{postContent.length} / 5000</em>
                        </label>

                        {/* 누르면 본문에 선택한 소제목을 추가한다. */}
                        <div
                            className="post-create-prompt-row"
                            aria-label="본문 구조 추가"
                        >
                            <span>ADD STRUCTURE</span>

                            {writingPrompts.map((prompt) => (
                                <button
                                    key={prompt}
                                    type="button"
                                    onClick={() => handlePromptInsert(prompt)}
                                >
                                    <i aria-hidden="true">+</i>
                                    {prompt}
                                </button>
                            ))}
                        </div>

                        <textarea
                            id="post-content"
                            value={postContent}
                            maxLength={5000}
                            placeholder={
                                '시장에 대한 생각을 자유롭게 적어주세요.\n근거와 관찰 포인트가 구체적일수록 좋아요.'
                            }
                            onChange={(event) =>
                                setPostContent(event.target.value)
                            }
                            required
                        />
                    </div>

                    <footer className="post-create-editor-footer">
                        <div className="post-create-visibility">
              <span
                  className="post-create-visibility-icon"
                  aria-hidden="true"
              >
                ◉
              </span>

                            <span>
                <strong>전체 공개</strong>
                <small>커뮤니티 피드에 게시됩니다.</small>
              </span>
                        </div>

                        <div className="post-create-actions">
                            <button
                                className="post-create-cancel-button"
                                type="button"
                                onClick={handleCancel}
                            >
                                취소
                            </button>

                            <button
                                className="post-create-submit-button"
                                type="submit"
                                disabled={!isPostReady || isSubmitting}
                            >
                             <span>
                            {isSubmitting ? '등록 중...' : '게시글 등록'}

                             <small>
                            {isSubmitting
                             ? 'CONNECTING TO SERVER'
                            : `${completedFieldCount} / 2 COMPLETE`}
                            </small>
                            </span>

                                <i aria-hidden="true">↗</i>
                            </button>
                        </div>
                    </footer>
                </form>
            </section>
        </main>
    )
}

export default PostCreatePage