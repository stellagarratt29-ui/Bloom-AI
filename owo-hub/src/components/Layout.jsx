import { NavLink, Outlet } from 'react-router-dom';
import Icon from './Icon';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: 'home', end: true },
  { to: '/classes', label: 'Classes', icon: 'users' },
  { to: '/economy', label: 'Economy', icon: 'coins' },
  { to: '/locations', label: 'Locations', icon: 'map' },
  { to: '/visual-guide', label: 'Visual Guide', icon: 'palette' },
  { to: '/boss-arenas', label: 'Boss Arenas', icon: 'skull' },
  { to: '/development', label: 'Development', icon: 'hammer' },
  { to: '/assignments', label: 'Assignments', icon: 'check' },
];

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-title">ONE WAY OUT</div>
          <div className="sidebar-subtitle">Developers Hub</div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' sidebar-link-active' : '')}
            >
              <Icon name={item.icon} size={17} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">Team hub &middot; data stored on this device</div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
