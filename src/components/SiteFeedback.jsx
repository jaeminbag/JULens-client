/* 공용 피드백 훅과 Provider를 함께 내보내므로 Fast Refresh 규칙의 예외로 둔다. */
/* eslint-disable react-refresh/only-export-components */

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import './SiteFeedback.css'

const SiteFeedbackContext = createContext(null)

// 모든 페이지에서 JULens 스타일의 토스트와 확인 모달을 사용할 수 있게 제공한다.
export function SiteFeedbackProvider({ children }) {
    const [toast, setToast] = useState(null)
    const [confirmDialog, setConfirmDialog] = useState(null)

    // 연속으로 토스트가 표시돼도 이전 타이머가 새 토스트를 닫지 않도록 번호를 붙인다.
    const toastIdRef = useRef(0)

    // 확인 모달에서 사용자가 선택한 결과를 원래 호출 위치로 전달한다.
    const confirmResolverRef = useRef(null)

    const showToast = useCallback(({
                                       title = '알림',
                                       message,
                                       type = 'success',
                                       duration = 3200,
                                   }) => {
        toastIdRef.current += 1

        setToast({
            id: toastIdRef.current,
            title,
            message,
            type,
            duration,
        })
    }, [])

    const closeToast = useCallback(() => {
        setToast(null)
    }, [])

    // 토스트는 지정한 시간이 지나면 자동으로 사라진다.
    useEffect(() => {
        if (!toast) {
            return undefined
        }

        const timerId = window.setTimeout(() => {
            setToast((currentToast) =>
                currentToast?.id === toast.id ? null : currentToast,
            )
        }, toast.duration)

        return () => window.clearTimeout(timerId)
    }, [toast])

    const showConfirm = useCallback(({
                                         title,
                                         message,
                                         confirmText = '확인',
                                         cancelText = '취소',
                                         tone = 'default',
                                     }) => {
        // 이미 확인창이 열려 있다면 이전 요청은 취소된 것으로 정리한다.
        if (confirmResolverRef.current) {
            confirmResolverRef.current(false)
        }

        return new Promise((resolve) => {
            confirmResolverRef.current = resolve
            setConfirmDialog({
                title,
                message,
                confirmText,
                cancelText,
                tone,
            })
        })
    }, [])

    const closeConfirm = useCallback((confirmed) => {
        const resolveConfirm = confirmResolverRef.current

        confirmResolverRef.current = null
        setConfirmDialog(null)
        resolveConfirm?.(confirmed)
    }, [])

    // 확인 모달은 Escape 키로도 안전하게 취소할 수 있다.
    useEffect(() => {
        if (!confirmDialog) {
            return undefined
        }

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                closeConfirm(false)
            }
        }

        window.addEventListener('keydown', handleEscape)

        return () => window.removeEventListener('keydown', handleEscape)
    }, [closeConfirm, confirmDialog])

    const contextValue = useMemo(
        () => ({ showToast, showConfirm }),
        [showConfirm, showToast],
    )

    return (
        <SiteFeedbackContext.Provider value={contextValue}>
            {children}

            {/* 성공·오류 결과는 흐름을 막지 않는 사이트 내부 토스트로 안내한다. */}
            {toast && (
                <aside
                    className={`site-toast site-toast--${toast.type}`}
                    role="status"
                    aria-live="polite"
                >
                    <span className="site-toast-signal" aria-hidden="true" />

                    <div className="site-toast-content">
                        <strong>{toast.title}</strong>
                        <p>{toast.message}</p>
                    </div>

                    <button
                        type="button"
                        aria-label="알림 닫기"
                        onClick={closeToast}
                    >
                        ×
                    </button>
                </aside>
            )}

            {/* 삭제처럼 사용자의 선택이 필요한 동작만 확인 모달로 표시한다. */}
            {confirmDialog && (
                <div
                    className="site-dialog-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeConfirm(false)
                        }
                    }}
                >
                    <section
                        className={`site-dialog site-dialog--${confirmDialog.tone}`}
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="site-dialog-title"
                        aria-describedby="site-dialog-message"
                    >
                        <p className="site-dialog-label">JULENS · CONFIRM</p>
                        <h2 id="site-dialog-title">{confirmDialog.title}</h2>
                        <p id="site-dialog-message">
                            {confirmDialog.message}
                        </p>

                        <div className="site-dialog-actions">
                            <button
                                className="site-dialog-cancel"
                                type="button"
                                autoFocus
                                onClick={() => closeConfirm(false)}
                            >
                                {confirmDialog.cancelText}
                            </button>

                            <button
                                className="site-dialog-confirm"
                                type="button"
                                onClick={() => closeConfirm(true)}
                            >
                                {confirmDialog.confirmText}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </SiteFeedbackContext.Provider>
    )
}

// Provider 아래의 페이지에서 공용 피드백 기능을 가져온다.
export function useSiteFeedback() {
    const context = useContext(SiteFeedbackContext)

    if (!context) {
        throw new Error(
            'useSiteFeedback은 SiteFeedbackProvider 안에서 사용해야 합니다.',
        )
    }

    return context
}