import { getRealtimeFeedLabel } from '../utils/realtimeFeeds.js'

/** 체결가(IEX)와 참고 호가(Overnight)를 사용자가 구분할 수 있게 표시한다. */
export default function RealtimeFeedBadge({ feed }) {
    const label = getRealtimeFeedLabel(feed)
    if (!label) return null

    return <i className={`realtime-badge ${feed === 'OVERNIGHT' ? 'indicative' : ''}`}>{label}</i>
}
