import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { buildApiUrl } from '../api/client.js'
import { useSiteFeedback } from '../components/SiteFeedback.jsx'
import { getLoggedInUserId } from '../utils/auth.js'
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

    // 삭제 확인과 처리 결과를 JULens 공용 피드백 UI로 표시한다.
    const { showConfirm, showToast } = useSiteFeedback()

    // 서버에서 조회한 게시글과 요청 상태를 관리한다.
    const [post, setPost] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    // 게시글 삭제 요청의 진행 상태와 오류 메시지를 관리한다.
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState('')

    // JWT의 사용자 ID와 게시글 작성자 ID가 같을 때만 작성자로 판단한다.
    const loggedInUserId = getLoggedInUserId()

    const isAuthor =
        post !== null &&
        loggedInUserId !== null &&
        Number(post.userId) === loggedInUserId

    // 좋아요 요청 중 중복 클릭을 막고 오류 메시지를 관리한다.
    const [isLikeUpdating, setIsLikeUpdating] = useState(false)
    const [likeError, setLikeError] = useState('')

    // 게시글에 작성된 댓글 목록을 관리한다.
    const [comments, setComments] = useState([])
    const [isCommentsLoading, setIsCommentsLoading] = useState(true)

    // 댓글 입력 내용과 작성 요청 상태를 관리한다.
    const [commentContent, setCommentContent] = useState('')
    const [isCommentSubmitting, setIsCommentSubmitting] = useState(false)
    const [commentError, setCommentError] = useState('')

    // 수정 중인 댓글과 수정 입력 내용을 관리한다.
    const [editingCommentId, setEditingCommentId] = useState(null)
    const [editingCommentContent, setEditingCommentContent] = useState('')

// 댓글 수정·삭제 요청 상태와 댓글별 오류 메시지를 관리한다.
    const [updatingCommentId, setUpdatingCommentId] = useState(null)
    const [deletingCommentId, setDeletingCommentId] = useState(null)
    const [commentActionError, setCommentActionError] = useState({
        commentId: null,
        message: '',
    })

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
                    buildApiUrl(`/posts/${postId}`),
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

    useEffect(() => {
        const fetchComments = async () => {
            const accessToken = localStorage.getItem('accessToken')

            if (!accessToken) {
                setCommentError('댓글을 확인하려면 로그인이 필요합니다.')
                setIsCommentsLoading(false)
                return
            }

            try {
                setIsCommentsLoading(true)
                setCommentError('')

                // 현재 게시글에 작성된 댓글을 오래된 순서대로 조회한다.
                const response = await fetch(
                    buildApiUrl(`/posts/${postId}/comments`),
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    },
                )

                const result = await response.json()

                if (!response.ok || !result.success) {
                    throw new Error(
                        result.message || '댓글을 불러오지 못했습니다.',
                    )
                }

                // ApiResponse의 data에는 CommentResponse 배열이 들어 있다.
                setComments(result.data ?? [])
            } catch (requestError) {
                setComments([])

                if (requestError instanceof TypeError) {
                    setCommentError(
                        '서버에 연결할 수 없습니다. 백엔드 서버를 확인해주세요.',
                    )
                } else {
                    setCommentError(
                        requestError instanceof Error
                            ? requestError.message
                            : '댓글 조회 중 오류가 발생했습니다.',
                    )
                }
            } finally {
                setIsCommentsLoading(false)
            }
        }

        fetchComments()
    }, [postId])

    // 현재 좋아요 상태에 따라 추가 또는 취소 요청을 보낸다.
    const handleLikeClick = async () => {
        const accessToken = localStorage.getItem('accessToken')

        // 게시글을 아직 불러오지 않았거나 요청 중이면 실행하지 않는다.
        if (!post || isLikeUpdating) {
            return
        }

        if (!accessToken) {
            setLikeError('좋아요를 누르려면 로그인이 필요합니다.')
            return
        }

        // 현재 좋아요 상태의 반대 상태로 변경할 예정이다.
        const nextLiked = !post.liked

        try {
            setIsLikeUpdating(true)
            setLikeError('')

            const response = await fetch(
                buildApiUrl(`/posts/${postId}/likes`),
                {
                    // 좋아요가 없으면 추가하고, 이미 있으면 취소한다.
                    method: nextLiked ? 'POST' : 'DELETE',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            )

            // 좋아요 API는 ApiResponse<Void>를 반환한다.
            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || '좋아요 처리에 실패했습니다.',
                )
            }

            // 요청 성공 후 화면의 좋아요 상태와 개수를 즉시 갱신한다.
            setPost((currentPost) => {
                if (!currentPost) {
                    return currentPost
                }

                const currentLikeCount = currentPost.likeCount ?? 0

                return {
                    ...currentPost,
                    liked: nextLiked,
                    likeCount: nextLiked
                        ? currentLikeCount + 1
                        : Math.max(0, currentLikeCount - 1),
                }
            })
        } catch (requestError) {
            if (requestError instanceof TypeError) {
                setLikeError(
                    '서버에 연결할 수 없습니다. 백엔드 서버를 확인해주세요.',
                )
            } else {
                setLikeError(
                    requestError instanceof Error
                        ? requestError.message
                        : '좋아요 처리 중 오류가 발생했습니다.',
                )
            }
        } finally {
            setIsLikeUpdating(false)
        }
    }

    // 입력한 내용을 현재 게시글의 댓글로 등록한다.
    const handleCommentSubmit = async (event) => {
        event.preventDefault()

        const accessToken = localStorage.getItem('accessToken')
        const trimmedContent = commentContent.trim()

        if (isCommentSubmitting) {
            return
        }

        if (!accessToken) {
            setCommentError('댓글을 작성하려면 로그인이 필요합니다.')
            return
        }

        if (!trimmedContent) {
            setCommentError('댓글 내용을 입력해주세요.')
            return
        }

        if (trimmedContent.length > 500) {
            setCommentError('댓글은 최대 500자까지 작성할 수 있습니다.')
            return
        }

        try {
            setIsCommentSubmitting(true)
            setCommentError('')

            const response = await fetch(
                buildApiUrl(`/posts/${postId}/comments`),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },

                    // 백엔드 CommentCreateRequest의 content 필드에 맞춘다.
                    body: JSON.stringify({
                        content: trimmedContent,
                    }),
                },
            )

            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || '댓글 작성에 실패했습니다.',
                )
            }

            // 서버가 반환한 새 댓글을 기존 댓글 목록 마지막에 추가한다.
            setComments((currentComments) => [
                ...currentComments,
                result.data,
            ])

            // 작성 성공 후 입력창을 비운다.
            setCommentContent('')
        } catch (requestError) {
            if (requestError instanceof TypeError) {
                setCommentError(
                    '서버에 연결할 수 없습니다. 백엔드 서버를 확인해주세요.',
                )
            } else {
                setCommentError(
                    requestError instanceof Error
                        ? requestError.message
                        : '댓글 작성 중 오류가 발생했습니다.',
                )
            }
        } finally {
            setIsCommentSubmitting(false)
        }
    }

    // 선택한 댓글의 기존 내용을 입력창에 넣고 수정 모드로 전환한다.
    const startCommentEdit = (comment) => {
        const isCommentAuthor =
            loggedInUserId !== null &&
            Number(comment.userId) === loggedInUserId

        // 작성자가 아닌 사용자는 수정 모드에 들어갈 수 없다.
        if (!isCommentAuthor) {
            return
        }

        setEditingCommentId(comment.commentId)
        setEditingCommentContent(comment.content)
        setCommentActionError({
            commentId: null,
            message: '',
        })
    }

// 수정 내용을 저장하지 않고 기존 댓글 표시로 돌아간다.
    const cancelCommentEdit = () => {
        setEditingCommentId(null)
        setEditingCommentContent('')
        setCommentActionError({
            commentId: null,
            message: '',
        })
    }

// 수정한 댓글을 서버에 저장하고 해당 댓글만 새 응답으로 교체한다.
    const handleCommentUpdate = async (event, commentId) => {
        event.preventDefault()

        const accessToken = localStorage.getItem('accessToken')
        const trimmedContent = editingCommentContent.trim()

        // 다른 댓글을 수정 중이거나 이미 수정 요청 중이면 실행하지 않는다.
        if (
            editingCommentId !== commentId ||
            updatingCommentId !== null
        ) {
            return
        }

        if (!accessToken) {
            setCommentActionError({
                commentId,
                message: '댓글을 수정하려면 로그인이 필요합니다.',
            })
            return
        }

        if (!trimmedContent) {
            setCommentActionError({
                commentId,
                message: '댓글 내용을 입력해주세요.',
            })
            return
        }

        if (trimmedContent.length > 500) {
            setCommentActionError({
                commentId,
                message: '댓글은 최대 500자까지 작성할 수 있습니다.',
            })
            return
        }

        try {
            setUpdatingCommentId(commentId)
            setCommentActionError({
                commentId: null,
                message: '',
            })

            const response = await fetch(
                buildApiUrl(`/comments/${commentId}`),
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },

                    // CommentUpdateRequest의 content 필드에 맞춰 전송한다.
                    body: JSON.stringify({
                        content: trimmedContent,
                    }),
                },
            )

            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || '댓글 수정에 실패했습니다.',
                )
            }

            // 수정된 댓글만 서버 응답으로 교체한다.
            setComments((currentComments) =>
                currentComments.map((comment) =>
                    comment.commentId === commentId
                        ? result.data
                        : comment,
                ),
            )

            setEditingCommentId(null)
            setEditingCommentContent('')

            showToast({
                title: '수정 완료',
                message: '댓글이 정상적으로 수정되었습니다.',
                type: 'success',
            })
        } catch (requestError) {
            setCommentActionError({
                commentId,
                message:
                    requestError instanceof TypeError
                        ? '서버에 연결할 수 없습니다. 백엔드 서버를 확인해주세요.'
                        : requestError instanceof Error
                            ? requestError.message
                            : '댓글 수정 중 오류가 발생했습니다.',
            })
        } finally {
            setUpdatingCommentId(null)
        }
    }

// 선택한 댓글을 삭제하고 화면 목록에서도 제거한다.
    const handleCommentDelete = async (comment) => {
        const commentId = comment.commentId
        const accessToken = localStorage.getItem('accessToken')

        const isCommentAuthor =
            loggedInUserId !== null &&
            Number(comment.userId) === loggedInUserId

        // 작성자가 아니거나 다른 요청이 진행 중이면 실행하지 않는다.
        if (
            !isCommentAuthor ||
            updatingCommentId !== null ||
            deletingCommentId !== null
        ) {
            return
        }

        if (!accessToken) {
            setCommentActionError({
                commentId,
                message: '댓글을 삭제하려면 로그인이 필요합니다.',
            })
            return
        }

        // 기존 JULens 확인 모달을 이용해 삭제 여부를 확인한다.
        const shouldDelete = await showConfirm({
            title: '댓글을 삭제하시겠습니까?',
            message: '삭제한 댓글은 복구할 수 없습니다.',
            confirmText: '삭제하기',
            cancelText: '취소',
            tone: 'danger',
        })

        if (!shouldDelete) {
            return
        }

        try {
            setDeletingCommentId(commentId)
            setCommentActionError({
                commentId: null,
                message: '',
            })

            const response = await fetch(
                buildApiUrl(`/comments/${commentId}`),
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            )

            // 서버는 ApiResponse<Void> 형식으로 반환한다.
            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || '댓글 삭제에 실패했습니다.',
                )
            }

            // 삭제된 댓글만 화면 목록에서 제거한다.
            setComments((currentComments) =>
                currentComments.filter(
                    (currentComment) =>
                        currentComment.commentId !== commentId,
                ),
            )

            showToast({
                title: '삭제 완료',
                message: '댓글이 정상적으로 삭제되었습니다.',
                type: 'success',
            })
        } catch (requestError) {
            setCommentActionError({
                commentId,
                message:
                    requestError instanceof TypeError
                        ? '서버에 연결할 수 없습니다. 백엔드 서버를 확인해주세요.'
                        : requestError instanceof Error
                            ? requestError.message
                            : '댓글 삭제 중 오류가 발생했습니다.',
            })
        } finally {
            setDeletingCommentId(null)
        }
    }

    // 현재 로그인 사용자가 작성한 게시글을 삭제한다.
    const handlePostDelete = async () => {
        const accessToken = localStorage.getItem('accessToken')

        // 게시글이 없거나 작성자가 아니거나 이미 삭제 요청 중이면 실행하지 않는다.
        if (!post || !isAuthor || isDeleting) {
            return
        }

        if (!accessToken) {
            setDeleteError('게시글을 삭제하려면 로그인이 필요합니다.')
            return
        }

        // 삭제는 되돌릴 수 없으므로 사이트 내부 확인 모달에서 한 번 더 묻는다.
        const shouldDelete = await showConfirm({
            title: '게시글을 삭제하시겠습니까?',
            message: '삭제한 게시글과 댓글은 복구할 수 없습니다.',
            confirmText: '삭제하기',
            cancelText: '취소',
            tone: 'danger',
        })

        if (!shouldDelete) {
            return
        }

        try {
            setIsDeleting(true)
            setDeleteError('')

            const response = await fetch(
                buildApiUrl(`/posts/${postId}`),
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            )

            // 백엔드의 ApiResponse<Void> 응답을 변환한다.
            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || '게시글 삭제에 실패했습니다.',
                )
            }

            showToast({
                title: '삭제 완료',
                message: '게시글이 정상적으로 삭제되었습니다.',
                type: 'success',
            })

            // 삭제된 상세 페이지가 브라우저 뒤로가기에 남지 않도록 목록으로 교체 이동한다.
            navigate('/community', { replace: true })
        } catch (requestError) {
            if (requestError instanceof TypeError) {
                setDeleteError(
                    '서버에 연결할 수 없습니다. 백엔드 서버를 확인해주세요.',
                )
            } else {
                setDeleteError(
                    requestError instanceof Error
                        ? requestError.message
                        : '게시글 삭제 중 오류가 발생했습니다.',
                )
            }
        } finally {
            setIsDeleting(false)
        }
    }

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
                    onClick={() => navigate('/community')}
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

                        <button type="button" onClick={() => navigate('/community')}>
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

                            {/* 로그인 사용자가 작성자인 경우에만 수정·삭제 버튼을 표시한다. */}
                            {isAuthor && (
                                <div className="post-detail-author-actions">
                                    <button
                                        className="post-detail-edit-button"
                                        type="button"
                                        disabled={isDeleting}
                                        onClick={() => navigate(`/posts/${postId}/edit`)}
                                    >
                                        수정
                                    </button>

                                    <button
                                        className="post-detail-delete-button"
                                        type="button"
                                        disabled={isDeleting}
                                        onClick={handlePostDelete}
                                    >
                                        {isDeleting ? '삭제 중...' : '삭제'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 삭제 요청만 실패했을 때 게시글은 유지하고 오류만 표시한다. */}
                        {deleteError && (
                            <p className="post-detail-delete-error">{deleteError}</p>
                        )}

                        {/* 줄바꿈을 유지하면서 게시글 전체 내용을 표시한다. */}
                        <p className="post-detail-content">
                            {post.content}
                        </p>
                        {/* 현재 사용자의 좋아요 상태와 전체 좋아요 개수를 표시한다. */}
                        <div className="post-detail-engagement">
                            <button
                                className={
                                    post.liked
                                        ? 'post-detail-like-button liked'
                                        : 'post-detail-like-button'
                                }
                                type="button"
                                aria-label={post.liked ? '좋아요 취소' : '좋아요'}
                                aria-pressed={post.liked}
                                disabled={isLikeUpdating}
                                onClick={handleLikeClick}
                            >
                                {/* 좋아요 여부는 배경색으로만 표시하고 하트 모양은 유지한다. */}
                                <span className="post-detail-like-icon" aria-hidden="true">
        ♡
    </span>

                                <strong>{post.likeCount ?? 0}</strong>
                            </button>

                            {likeError && (
                                // 좋아요 요청만 실패했을 때 게시글 전체를 오류 화면으로 바꾸지 않는다.
                                <p className="post-detail-like-error">{likeError}</p>
                            )}
                        </div>
                        {/* 댓글 작성과 댓글 목록을 표시하는 영역이다. */}
                        <section className="post-detail-comments">
                            <div className="post-detail-comments-header">
                                <span>COMMENTS</span>
                                <strong>{comments.length}</strong>
                            </div>

                            <form
                                className="post-detail-comment-form"
                                onSubmit={handleCommentSubmit}
                            >
        <textarea
            value={commentContent}
            maxLength={500}
            placeholder="댓글을 입력해주세요."
            aria-label="댓글 내용"
            disabled={isCommentSubmitting}
            onChange={(event) => {
                // 입력창의 현재 내용을 상태에 저장한다.
                setCommentContent(event.target.value)
            }}
        />

                                <div className="post-detail-comment-form-bottom">
                                    <span>{commentContent.length} / 500</span>

                                    <button
                                        type="submit"
                                        disabled={
                                            isCommentSubmitting ||
                                            isCommentsLoading ||
                                            !commentContent.trim()
                                        }
                                    >
                                        {isCommentSubmitting ? '작성 중...' : '댓글 작성'}
                                    </button>
                                </div>
                            </form>

                            {commentError && (
                                <p className="post-detail-comment-error">
                                    {commentError}
                                </p>
                            )}

                            <div className="post-detail-comment-list">
                                {isCommentsLoading ? (
                                    <p className="post-detail-comment-status">
                                        댓글을 불러오는 중입니다...
                                    </p>
                                ) : comments.length === 0 ? (
                                    <p className="post-detail-comment-status">
                                        아직 작성된 댓글이 없습니다.
                                    </p>
                                ) : (
                                    comments.map((comment) => {
                                        // 로그인 사용자와 댓글 작성자가 같을 때만 버튼을 표시한다.
                                        const isCommentAuthor =
                                            loggedInUserId !== null &&
                                            Number(comment.userId) === loggedInUserId

                                        const isEditing =
                                            editingCommentId === comment.commentId

                                        const isUpdating =
                                            updatingCommentId === comment.commentId

                                        const isCommentDeleting =
                                            deletingCommentId === comment.commentId

                                        const actionError =
                                            commentActionError.commentId === comment.commentId
                                                ? commentActionError.message
                                                : ''

                                        return (
                                            <article
                                                className="post-detail-comment"
                                                key={comment.commentId}
                                            >
                                                <div className="post-detail-comment-top">
                                                    <div className="post-detail-comment-meta">
                                                        <strong>@{comment.nickname}</strong>

                                                        <span>
                        {formatPostDate(comment.createdAt)}
                    </span>
                                                    </div>

                                                    {/* 내가 작성한 댓글에만 수정·삭제 버튼을 표시한다. */}
                                                    {isCommentAuthor && !isEditing && (
                                                        <div className="post-detail-comment-actions">
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    editingCommentId !== null ||
                                                                    updatingCommentId !== null ||
                                                                    deletingCommentId !== null
                                                                }
                                                                onClick={() =>
                                                                    startCommentEdit(comment)
                                                                }
                                                            >
                                                                수정
                                                            </button>

                                                            <button
                                                                className="delete"
                                                                type="button"
                                                                disabled={
                                                                    editingCommentId !== null ||
                                                                    updatingCommentId !== null ||
                                                                    deletingCommentId !== null
                                                                }
                                                                onClick={() =>
                                                                    handleCommentDelete(comment)
                                                                }
                                                            >
                                                                {isCommentDeleting
                                                                    ? '삭제 중...'
                                                                    : '삭제'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {isEditing ? (
                                                    <form
                                                        className="post-detail-comment-edit-form"
                                                        onSubmit={(event) =>
                                                            handleCommentUpdate(
                                                                event,
                                                                comment.commentId,
                                                            )
                                                        }
                                                    >
                    <textarea
                        value={editingCommentContent}
                        maxLength={500}
                        aria-label="수정할 댓글 내용"
                        disabled={isUpdating}
                        onChange={(event) =>
                            setEditingCommentContent(
                                event.target.value,
                            )
                        }
                    />

                                                        <div className="post-detail-comment-edit-bottom">
                        <span>
                            {editingCommentContent.length} / 500
                        </span>

                                                            <div>
                                                                <button
                                                                    className="cancel"
                                                                    type="button"
                                                                    disabled={isUpdating}
                                                                    onClick={cancelCommentEdit}
                                                                >
                                                                    취소
                                                                </button>

                                                                <button
                                                                    className="save"
                                                                    type="submit"
                                                                    disabled={
                                                                        isUpdating ||
                                                                        !editingCommentContent.trim()
                                                                    }
                                                                >
                                                                    {isUpdating
                                                                        ? '저장 중...'
                                                                        : '저장'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    // 수정 중이 아닐 때는 기존 댓글 내용을 표시한다.
                                                    <p>{comment.content}</p>
                                                )}

                                                {actionError && (
                                                    <p className="post-detail-comment-action-error">
                                                        {actionError}
                                                    </p>
                                                )}
                                            </article>
                                        )
                                    })
                                )}
                            </div>
                        </section>
                    </article>
                )}
            </section>
        </main>
    )
}

export default PostDetailPage
