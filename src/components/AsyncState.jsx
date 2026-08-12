export default function AsyncState({ loading, error, empty, onRetry }) {
    if (!loading && !error && !empty) return null
    return <div className="async-state" role="status">
        <strong>{loading ? '데이터를 불러오는 중입니다' : error ? '불러오지 못했습니다' : '표시할 결과가 없습니다'}</strong>
        <p>{loading ? '잠시만 기다려주세요.' : error || '검색어나 필터를 조정해보세요.'}</p>
        {error && <button type="button" onClick={onRetry}>다시 시도</button>}
    </div>
}
