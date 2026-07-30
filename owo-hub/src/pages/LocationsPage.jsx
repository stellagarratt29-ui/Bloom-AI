import { useState } from 'react';
import CrudList from '../components/CrudList';
import { locationSchema } from '../schema/locationSchema';
import { seedLocations } from '../data/seed';
import { useCollection } from '../lib/useCollection';
import { WORLDS } from '../schema/constants';

const EXPECTED_COUNTS = { Forest: 15, Jurassic: 11, Atlantis: 13, 'Mount Olympus': 12 };

export default function LocationsPage() {
  const { items, addItem, updateItem, deleteItem, deleteMany } = useCollection('locations', seedLocations);
  const [world, setWorld] = useState(WORLDS[0]);

  const filtered = items.filter((l) => l.world === world);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Locations</h1>
        <p className="page-subtitle">Every named location across all 4 worlds.</p>
      </div>

      <div className="tab-row">
        {WORLDS.map((w) => (
          <button
            key={w}
            className={'tab-btn' + (world === w ? ' tab-btn-active' : '')}
            onClick={() => setWorld(w)}
          >
            {w} ({items.filter((l) => l.world === w).length}/{EXPECTED_COUNTS[w]})
          </button>
        ))}
      </div>

      <CrudList
        schema={locationSchema}
        items={filtered}
        onAdd={(record) => addItem({ ...record, world })}
        onUpdate={updateItem}
        onDelete={deleteItem}
        onDeleteMany={deleteMany}
        addLabel="Add Location"
        emptyLabel={`No ${world} locations yet.`}
        newRecordDefaults={{ world, difficulty: 'Low', size: 'Medium', whatsThere: [], enemies: [], loot: [], resources: [] }}
        renderCard={(l) => (
          <>
            {l.image && <img src={l.image} alt={l.name} className="card-thumb" />}
            <h3 className="card-title">{l.name}</h3>
            <div className="card-badges">
              {l.biome && <span className="badge">{l.biome}</span>}
              <span className="badge">{l.difficulty}</span>
              <span className="badge">{l.size}</span>
            </div>
            {l.description && <p className="card-line">{l.description}</p>}
            {l.coordinates && <p className="card-line">{l.coordinates} &middot; {l.travelTime}</p>}
            {l.enemies?.length > 0 && <p className="card-line">Enemies: {l.enemies.join(', ')}</p>}
          </>
        )}
      />
    </div>
  );
}
