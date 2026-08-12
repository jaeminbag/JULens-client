export default function Pagination({ page, totalPages, onChange }) {
    if (totalPages <= 1) return null
    return <nav className="pagination" aria-label="페이지 이동">
        <button disabled={page === 1} onClick={() => onChange(page - 1)}>이전</button>
        <span><b>{page}</b> / {totalPages}</span>
        <button disabled={page === totalPages} onClick={() => onChange(page + 1)}>다음</button>
    </nav>
}
