import { useState } from 'react';
import CrudList from '../components/CrudList';
import { devTaskSchema } from '../schema/devTaskSchema';
import { seedDevTasks, seedTimeline } from '../data/seed';
import { useCollection } from '../lib/useCollection';
import { useRecord } from '../lib/useRecord';
import { WORLDS, TEAM_MEMBERS } from '../schema/constants';

const STATUS_BADGE = {
  'Not Started': 'badge',
  'In Progress': 'badge badge-accent',
  Done: 'badge badge-accent',
};

function Workload({ items }) {
  return (
    <div className="dashboard-grid" style={{ marginBottom: 24 }}>
      {TEAM_MEMBERS.map((person) => {
        const open = items.filter((t) => t.assignee === person && t.status !== 'Done').length;
        return (
          <div key={person} className="stat-tile">
            <div className="stat-tile-value">{open}</div>
            <div className="stat-tile-label">{person}</div>
          </div>
        );
      })}
    </div>
  );
}

function Timeline() {
  const [timeline, update] = useRecord('timeline', seedTimeline);
  return (
    <div className="simple-form" style={{ marginBottom: 24 }}>
      <div className="color-group-title" style={{ margin: 0 }}>Overall Timeline</div>
      <div className="field-grid">
        <div>
          <label className="field-label">Design Phase</label>
          <input className="field-input" value={timeline.designPhase} onChange={(e) => update({ designPhase: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Mac Arrives</label>
          <input className="field-input" value={timeline.macArrives} onChange={(e) => update({ macArrives: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Forest Construction</label>
          <input className="field-input" value={timeline.forestConstruction} onChange={(e) => update({ forestConstruction: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Forest Launch</label>
          <input className="field-input" value={timeline.forestLaunch} onChange={(e) => update({ forestLaunch: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

export default function DevelopmentPage() {
  const { items, addItem, updateItem, deleteItem } = useCollection('devtasks', seedDevTasks);
  const [world, setWorld] = useState('All');
  const [person, setPerson] = useState('All');

  const filtered = items
    .filter((t) => world === 'All' || t.world === world)
    .filter((t) => person === 'All' || t.assignee === person)
    .slice()
    .sort((a, b) => (a.priority || 0) - (b.priority || 0));

  const done = items.filter((t) => t.status === 'Done').length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Development</h1>
        <p className="page-subtitle">The building roadmap &mdash; {done}/{items.length} tasks done.</p>
      </div>

      <Timeline />

      <div className="color-group-title" style={{ marginTop: 0 }}>Open Tasks By Person</div>
      <Workload items={items} />

      <div className="tab-row">
        {['All', ...WORLDS, 'General'].map((w) => (
          <button key={w} className={'tab-btn' + (world === w ? ' tab-btn-active' : '')} onClick={() => setWorld(w)}>
            {w}
          </button>
        ))}
      </div>

      <div className="tab-row">
        {['All', ...TEAM_MEMBERS, 'Unassigned'].map((p) => (
          <button key={p} className={'tab-btn' + (person === p ? ' tab-btn-active' : '')} onClick={() => setPerson(p)}>
            {p}
          </button>
        ))}
      </div>

      <CrudList
        schema={devTaskSchema}
        items={filtered}
        onAdd={addItem}
        onUpdate={updateItem}
        onDelete={deleteItem}
        addLabel="Add Task"
        emptyLabel="No tasks here."
        newRecordDefaults={{
          world: world === 'All' ? 'General' : world,
          assignee: TEAM_MEMBERS.includes(person) ? person : 'Unassigned',
          status: 'Not Started',
          priority: items.length + 1,
          breakdown: [],
        }}
        renderCard={(t) => (
          <>
            <h3 className="card-title">Priority {t.priority}: {t.name}</h3>
            <div className="card-badges">
              <span className="badge">{t.world}</span>
              <span className={STATUS_BADGE[t.status] || 'badge'}>{t.status}</span>
              {t.assignee && t.assignee !== 'Unassigned' && <span className="badge badge-accent">{t.assignee}</span>}
              {t.estimatedTime && <span className="badge">{t.estimatedTime}</span>}
            </div>
            {t.description && <p className="card-line">{t.description}</p>}
            {t.breakdown?.length > 0 && (
              <ul className="card-line" style={{ margin: 0, paddingLeft: 18 }}>
                {t.breakdown.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            )}
          </>
        )}
      />
    </div>
  );
}
