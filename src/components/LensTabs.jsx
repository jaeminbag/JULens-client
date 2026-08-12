import { NavLink } from 'react-router-dom'

const tabs = [
    ['/today-lens', "Today's Lens"],
    ['/stock-news', 'Stock News'],
    ['/watchlist', 'My Watchlist'],
]

export default function LensTabs() {
    return <nav className="lens-tabs" aria-label="Lens 메뉴">
        {tabs.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
    </nav>
}
