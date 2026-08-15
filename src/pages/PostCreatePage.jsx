import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { buildApiUrl } from '../api/client.js'
import { useSiteFeedback } from '../components/SiteFeedback.jsx'
import { getLoggedInUserId } from '../utils/auth.js'
import './PostCreatePage.css'

// 본문을 구조적으로 작성할 때 빠르게 삽입할 수 있는 문구다.
const writingPrompts = ['판단 근거', '리스크 요인', '다음 관찰 포인트']

// JULens 커뮤니티의 게시글 작성 전용 페이지다.
function PostCreatePage({ mode = 'create' }) {
    const navigate = useNavigate()
    const { postId } = useParams()

    // 등록·수정 결과를 브라우저 팝업 대신 사이트 내부 토스트로 표시한다.
    const { showToast } = useSiteFeedback()

    // 라우터에서 전달받은 mode가 edit이면 게시글 수정 화면으로 사용한다.
    const isEditMode = mode === 'edit'

    // 작성 모드에서는 빈 값으로 시작하고,
    // 수정 모드에서는 조회한 기존 제목과 내용이 이 상태에 저장된다.
    const [postTitle, setPostTitle] = useState('')
    const [postContent, setPostContent] = useState('')

    // 수정할 기존 게시글을 불러오는 상태와 오류 메시지를 관리한다.
    const [isPostLoading, setIsPostLoading] = useState(isEditMode)
    const [loadError, setLoadError] = useState('')

    // 게시글 등록 또는 수정 요청 중 버튼을 다시 누르지 못하게 관리한다.
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        // 작성 모드에서는 기존 게시글을 조회할 필요가 없다.
        if (!isEditMode) {
            return
        }

        // 수정 페이지에 표시할 기존 게시글을 상세 조회 API로 가져온다.
        const fetchPostForEdit = async () => {
            const accessToken = localStorage.getItem('accessToken')

            if (!accessToken) {
                setLoadError('게시글을 수정하려면 로그인이 필요합니다.')
                setIsPostLoading(false)
                return
            }

            try {
                setIsPostLoading(true)
                setLoadError('')

                const response = await fetch(
                    buildApiUrl(`/posts/${postId}`),
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    },
                )

                // ApiResponse<PostResponse>를 자바스크립트 객체로 변환한다.
                const result = await response.json()

                if (!response.ok || !result.success) {
                    throw new Error(
                        result.message ||
                        '수정할 게시글을 불러오지 못했습니다.',
                    )
                }

                const existingPost = result.data
                const loggedInUserId = getLoggedInUserId()

                if (!existingPost) {
                    throw new Error('게시글 정보가 없습니다.')
                }

                // 버튼을 숨기는 것뿐 아니라 직접 수정 주소로 들어온 경우도 차단한다.
                if (
                    loggedInUserId === null ||
                    Number(existingPost.userId) !== loggedInUserId
                ) {
                    setLoadError(
                        '본인이 작성한 게시글만 수정할 수 있습니다.',
                    )
                    return
                }

                // 조회한 기존 값을 입력창의 상태에 저장한다.
                // value={postTitle}, value={postContent}와 연결되어 있으므로
                // 입력창에 기존 제목과 내용이 자동으로 표시된다.
                setPostTitle(existingPost.title ?? '')
                setPostContent(existingPost.content ?? '')
            } catch (requestError) {
                if (requestError instanceof TypeError) {
                    setLoadError(
                        '서버에 연결할 수 없습니다. 백엔드 서버를 확인해주세요.',
                    )
                } else {
                    setLoadError(
                        requestError instanceof Error
                            ? requestError.message
                            : '게시글을 불러오는 중 오류가 발생했습니다.',
                    )
                }
            } finally {
                setIsPostLoading(false)
            }
        }

        fetchPostForEdit()
    }, [isEditMode, navigate, postId])

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

    // 작성 취소는 목록으로, 수정 취소는 원래 게시글 상세 화면으로 돌아간다.
    const handleCancel = () => {
        if (isEditMode) {
            navigate(`/posts/${postId}`)
            return
        }

        navigate('/community')
    }

    // 선택한 가이드 제목을 본문에 삽입한다.
    const handlePromptInsert = (prompt) => {
        const spacing = postContent.trim().length > 0 ? '\n\n' : ''

        setPostContent(`${postContent}${spacing}${prompt}\n`)
    }

    // 작성 모드에서는 새 게시글을 등록하고,
    // 수정 모드에서는 기존 게시글의 제목과 내용을 모두 수정한다.
    const handleSubmit = async (event) => {
        event.preventDefault()

        const accessToken = localStorage.getItem('accessToken')

        if (!accessToken) {
            showToast({
                title: '로그인 필요',
                message: '게시글을 작성하거나 수정하려면 로그인해주세요.',
                type: 'error',
            })
            navigate('/community')
            return
        }

        // 수정 여부에 따라 API 주소와 HTTP 메서드를 결정한다.
        const requestUrl = isEditMode
            ? buildApiUrl(`/posts/${postId}`)
            : buildApiUrl('/posts')

        const requestMethod = isEditMode ? 'PUT' : 'POST'

        try {
            setIsSubmitting(true)

            const response = await fetch(requestUrl, {
                method: requestMethod,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },

                // PUT 전체 수정 방식이므로 수정하지 않은 값도 포함해
                // 제목과 내용을 모두 서버에 전달한다.
                body: JSON.stringify({
                    title: postTitle.trim(),
                    content: postContent.trim(),
                }),
            })

            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    (isEditMode
                        ? '게시글 수정에 실패했습니다.'
                        : '게시글 등록에 실패했습니다.'),
                )
            }

            if (isEditMode) {
                showToast({
                    title: '수정 완료',
                    message: '게시글이 정상적으로 수정되었습니다.',
                    type: 'success',
                })

                // 수정 결과를 바로 확인할 수 있도록 해당 상세 페이지로 이동한다.
                navigate(`/posts/${postId}`)
            } else {
                showToast({
                    title: '등록 완료',
                    message: '새 게시글이 정상적으로 등록되었습니다.',
                    type: 'success',
                })
                navigate('/community')
            }
        } catch (requestError) {
            const errorMessage =
                requestError instanceof TypeError
                    ? '서버에 연결할 수 없습니다. 백엔드 서버를 확인해주세요.'
                    : requestError instanceof Error
                        ? requestError.message
                        : '게시글 처리 중 오류가 발생했습니다.'

            showToast({
                title: isEditMode ? '수정 실패' : '등록 실패',
                message: errorMessage,
                type: 'error',
                duration: 4500,
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    // 수정할 게시글을 가져오기 전에는 빈 입력창 대신 로딩 화면을 표시한다.
    if (isEditMode && isPostLoading) {
        return (
            <main className="post-create-page">
                <div
                    className="post-create-background-mark"
                    aria-hidden="true"
                >
                    J
                </div>

                <section className="post-create-load-state">
                    <p>EDIT COMMUNITY SIGNAL</p>
                    <h1>기존 게시글을 불러오는 중입니다...</h1>
                </section>
            </main>
        )
    }

// 조회 실패 또는 다른 사용자의 수정 주소로 접근한 경우다.
    if (isEditMode && loadError) {
        return (
            <main className="post-create-page">
                <div
                    className="post-create-background-mark"
                    aria-hidden="true"
                >
                    J
                </div>

                <section className="post-create-load-state is-error">
                    <p>EDIT COMMUNITY SIGNAL · ERROR</p>
                    <h1>{loadError}</h1>

                    <button type="button" onClick={() => navigate('/community')}>
                        게시글 목록으로 돌아가기
                    </button>
                </section>
            </main>
        )
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
                    {/* 현재 에디터가 작성 화면인지 수정 화면인지 표시한다. */}
                    <strong>{isEditMode ? 'EDIT SIGNAL' : 'CREATE SIGNAL'}</strong>
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
                            {isEditMode ? 'EDIT COMMUNITY SIGNAL' : 'NEW COMMUNITY SIGNAL'}
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
                            <h2>{isEditMode ? '게시글 수정' : '새 게시글 작성'}</h2>
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
                            {/* 작성 모드와 수정 모드에 맞는 버튼 문구를 표시한다. */}
                                 {isSubmitting
                                     ? isEditMode
                                         ? '수정 중...'
                                         : '등록 중...'
                                     : isEditMode
                                         ? '수정 완료'
                                         : '게시글 등록'}

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
