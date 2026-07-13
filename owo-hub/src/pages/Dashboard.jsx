import { Link } from 'react-router-dom';
import { useCollection } from '../lib/useCollection';
import {
  seedClasses, seedLocations, seedBosses, seedDevTasks, seedAnimals, seedItems,
} from '../data/seed';

const TILES = [
  { to: '/classes', label: 'Classes', key: 'classes', seed: seedClasses },
  { to: '/locations', label: 'Locations', key: 'locations', seed: seedLocations },
  { to: '/economy', label: 'Animals Logged', key: 'animals', seed: seedAnimals },
  { to: '/economy', label: 'Items Logged', key: 'items', seed: seedItems },
  { to: '/boss-arenas', label: 'Boss Arenas', key: 'bosses', seed: seedBosses },
  { to: '/development', label: 'Dev Tasks', key: 'devtasks', seed: seedDevTasks },
  { to: '/assignments', label: 'Assignments', key: 'assignments', seed: [] },
];

function Tile({ tile }) {
  const { items } = useCollection(tile.key, tile.seed);
  return (
    <Link to={tile.to} className="stat-tile" style={{ display: 'block' }}>
      <div className="stat-tile-value">{items.length}</div>
      <div className="stat-tile-label">{tile.label}</div>
    </Link>
  );
}

export default function Dashboard() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">ONE WAY OUT — Developers Hub</h1>
        <p className="page-subtitle">
          The single source of truth for the entire ONE WAY OUT project. Classes, economy,
          locations, visual guide, boss arenas, and the development roadmap &mdash; all in one place.
        </p>
      </div>

      <div className="dashboard-grid">
        {TILES.map((tile) => <Tile key={tile.label} tile={tile} />)}
      </div>

      <div className="simple-form">
        <div className="color-group-title" style={{ margin: 0 }}>Quick Links</div>
        <div className="card-badges">
          <Link to="/classes"><span className="badge badge-accent">Classes</span></Link>
          <Link to="/economy"><span className="badge badge-accent">Economy</span></Link>
          <Link to="/locations"><span className="badge badge-accent">Locations</span></Link>
          <Link to="/visual-guide"><span className="badge badge-accent">Visual Guide</span></Link>
          <Link to="/boss-arenas"><span className="badge badge-accent">Boss Arenas</span></Link>
          <Link to="/development"><span className="badge badge-accent">Development</span></Link>
          <Link to="/assignments"><span className="badge badge-accent">Assignments</span></Link>
        </div>
      </div>
    </div>
  );
}
