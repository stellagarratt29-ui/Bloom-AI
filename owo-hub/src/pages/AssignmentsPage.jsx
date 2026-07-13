import { useState } from 'react';
import CrudList from '../components/CrudList';
import { assignmentSchema } from '../schema/assignmentSchema';
import { useCollection } from '../lib/useCollection';
import { TEAM_MEMBERS, TASK_STATUSES } from '../schema/constants';

const STATUS_BADGE = {
  'Not Started': 'badge',
  'In Progress': 'badge badge-accent',
  Done: 'badge badge-accent',
};

function Workload({ items }) {
  return (
    <div className="dashboard-grid" style={{ marginBottom: 24 }}>
      {TEAM_MEMBERS.map((person) => {
        const open = items.filter((a) => a.assignedTo === person && a.status !== 'Done').length;
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

export default function AssignmentsPage() {
  const { items, addItem, updateItem, deleteItem, deleteMany } = useCollection('assignments', []);
  const [person, setPerson] = useState('All');

  const filtered = items.filter((a) => person === 'All' || a.assignedTo === person);
  const done = items.filter((a) => a.status === 'Done').length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Assignments</h1>
        <p className="page-subtitle">
          Post tasks straight to a person instead of texting them &mdash; {done}/{items.length} done.
        </p>
      </div>

      <div className="color-group-title" style={{ marginTop: 0 }}>Open Tasks By Person</div>
      <Workload items={items} />

      <div className="tab-row">
        {['All', ...TEAM_MEMBERS, 'Unassigned'].map((p) => (
          <button key={p} className={'tab-btn' + (person === p ? ' tab-btn-active' : '')} onClick={() => setPerson(p)}>
            {p}
          </button>
        ))}
      </div>

      <CrudList
        schema={assignmentSchema}
        items={filtered}
        onAdd={addItem}
        onUpdate={updateItem}
        onDelete={deleteItem}
        onDeleteMany={deleteMany}
        addLabel="Add Assignment"
        emptyLabel="Nothing assigned here yet."
        newRecordDefaults={{
          assignedTo: TEAM_MEMBERS.includes(person) ? person : 'Unassigned',
          status: TASK_STATUSES[0],
        }}
        renderCard={(a) => (
          <>
            {a.attachment && <img src={a.attachment} alt={a.title} className="card-thumb" />}
            <h3 className="card-title">{a.title}</h3>
            <div className="card-badges">
              {a.assignedTo && a.assignedTo !== 'Unassigned' && <span className="badge badge-accent">{a.assignedTo}</span>}
              <span className={STATUS_BADGE[a.status] || 'badge'}>{a.status}</span>
              {a.dueDate && <span className="badge">{a.dueDate}</span>}
            </div>
            {a.notes && <p className="card-line">{a.notes}</p>}
          </>
        )}
      />
    </div>
  );
}
