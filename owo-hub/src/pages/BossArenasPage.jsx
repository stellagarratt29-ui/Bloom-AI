import CrudList from '../components/CrudList';
import { bossSchema } from '../schema/bossSchema';
import { seedBosses } from '../data/seed';
import { useCollection } from '../lib/useCollection';

export default function BossArenasPage() {
  const { items, addItem, updateItem, deleteItem, deleteMany } = useCollection('bosses', seedBosses);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Boss Arenas</h1>
        <p className="page-subtitle">The 4 final boss battles &mdash; the most important encounters in the game.</p>
      </div>

      <CrudList
        schema={bossSchema}
        items={items}
        onAdd={addItem}
        onUpdate={updateItem}
        onDelete={deleteItem}
        onDeleteMany={deleteMany}
        addLabel="Add Boss Arena"
        emptyLabel="No boss arenas yet."
        newRecordDefaults={{ mechanics: [], arenaSize: 'Large' }}
        renderCard={(b) => (
          <>
            {b.image && <img src={b.image} alt={b.bossName} className="card-thumb" />}
            <h3 className="card-title">{b.bossName}</h3>
            <div className="card-badges">
              <span className="badge">{b.arenaName}</span>
              <span className="badge">{b.arenaSize}</span>
            </div>
            {b.layout && <p className="card-line">{b.layout}</p>}
            {b.mechanics?.length > 0 && (
              <ul className="card-line" style={{ margin: 0, paddingLeft: 18 }}>
                {b.mechanics.slice(0, 3).map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            )}
            {b.weakness && <p className="card-line">Weakness: {b.weakness}</p>}
          </>
        )}
      />
    </div>
  );
}
