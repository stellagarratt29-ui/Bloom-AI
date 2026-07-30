import { useState } from 'react';
import CrudList from '../components/CrudList';
import { classSchema } from '../schema/classSchema';
import { seedClasses } from '../data/seed';
import { useCollection } from '../lib/useCollection';
import { WORLDS } from '../schema/constants';

export default function ClassesPage() {
  const { items, addItem, updateItem, deleteItem, deleteMany } = useCollection('classes', seedClasses);
  const [world, setWorld] = useState('All');

  const filtered = world === 'All' ? items : items.filter((c) => c.world === world);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Classes</h1>
        <p className="page-subtitle">All playable classes across the 4 worlds &mdash; {items.length} total.</p>
      </div>

      <div className="tab-row">
        {['All', ...WORLDS].map((w) => (
          <button
            key={w}
            className={'tab-btn' + (world === w ? ' tab-btn-active' : '')}
            onClick={() => setWorld(w)}
          >
            {w}
          </button>
        ))}
      </div>

      <CrudList
        schema={classSchema}
        items={filtered}
        onAdd={addItem}
        onUpdate={updateItem}
        onDelete={deleteItem}
        onDeleteMany={deleteMany}
        addLabel="Add Class"
        emptyLabel="No classes in this world yet."
        newRecordDefaults={{ world: world === 'All' ? WORLDS[0] : world, startingItems: [], weaponProgression: [] }}
        renderCard={(c) => (
          <>
            {c.icon && <img src={c.icon} alt={c.name} className="card-thumb" />}
            <h3 className="card-title">{c.name}</h3>
            <div className="card-badges">
              <span className="badge">{c.world}</span>
              <span className="badge badge-accent">{c.unlockCost ? `${c.unlockCost} coins` : 'Free'}</span>
            </div>
            <div className="stat-row">
              <span className="stat-pill">HP <b>{c.health}</b></span>
              <span className="stat-pill">DMG <b>{c.damage}</b></span>
              <span className="stat-pill">DEF <b>{c.defense}</b></span>
              <span className="stat-pill">SPD <b>{c.speed}</b></span>
            </div>
            {c.ability && <p className="card-line">{c.ability}</p>}
            {c.weaponProgression?.length > 0 && (
              <p className="card-line">Progression: {c.weaponProgression.join(' → ')}</p>
            )}
          </>
        )}
      />
    </div>
  );
}
