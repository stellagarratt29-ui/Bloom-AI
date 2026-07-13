import { useState } from 'react';
import CrudForm from './CrudForm';
import ConfirmDialog from './ConfirmDialog';

// Generic "list of cards + add/edit/delete" scaffold. The caller supplies
// the schema (drives the form) and a renderCard function (drives the
// per-section card look), so every section shares one CRUD implementation.
export default function CrudList({
  schema,
  items,
  onAdd,
  onUpdate,
  onDelete,
  onDeleteMany,
  renderCard,
  emptyLabel = 'Nothing here yet.',
  addLabel = 'Add New',
  newRecordDefaults = {},
}) {
  const [editing, setEditing] = useState(null); // { mode: 'add'|'edit', item }
  const [pendingDelete, setPendingDelete] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);

  const closeForm = () => setEditing(null);

  const handleSave = (draft) => {
    if (editing.mode === 'add') {
      onAdd(draft);
    } else {
      onUpdate(editing.item.id, draft);
    }
    closeForm();
  };

  const toggleSelecting = () => {
    setSelecting((s) => !s);
    setSelected(new Set());
  };

  const toggleSelected = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (onDeleteMany) {
      onDeleteMany([...selected]);
    } else {
      selected.forEach((id) => onDelete(id));
    }
    setSelected(new Set());
    setSelecting(false);
    setConfirmBulk(false);
  };

  return (
    <div>
      <div className="section-toolbar">
        {selecting ? (
          <>
            <span className="select-count">{selected.size} selected</span>
            <button className="btn btn-ghost" onClick={toggleSelecting}>Cancel</button>
            <button className="btn btn-danger" disabled={selected.size === 0} onClick={() => setConfirmBulk(true)}>
              Delete Selected
            </button>
          </>
        ) : (
          <>
            {items.length > 0 && (
              <button className="btn btn-ghost" onClick={toggleSelecting}>Select</button>
            )}
            <button className="btn btn-primary" onClick={() => setEditing({ mode: 'add', item: newRecordDefaults })}>
              + {addLabel}
            </button>
          </>
        )}
      </div>

      {items.length === 0 ? (
        <div className="empty-state">{emptyLabel}</div>
      ) : (
        <div className="card-grid">
          {items.map((item) => (
            <div key={item.id} className="item-card">
              {selecting && (
                <label className="select-checkbox-row">
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggleSelected(item.id)}
                  />
                  Select
                </label>
              )}
              {renderCard(item)}
              {!selecting && (
                <div className="item-card-actions">
                  <button className="btn btn-small" onClick={() => setEditing({ mode: 'edit', item })}>Edit</button>
                  <button className="btn btn-small btn-ghost" onClick={() => setPendingDelete(item)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <CrudForm
          schema={schema}
          initial={editing.item}
          title={editing.mode === 'add' ? `${addLabel}` : `Edit ${editing.item[schema.titleKey] || ''}`}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this entry?"
        message={pendingDelete ? `"${pendingDelete[schema.titleKey] || 'This item'}" will be permanently removed.` : ''}
        onConfirm={() => { onDelete(pendingDelete.id); setPendingDelete(null); }}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={confirmBulk}
        title={`Delete ${selected.size} ${selected.size === 1 ? 'entry' : 'entries'}?`}
        message="This can't be undone."
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulk(false)}
      />
    </div>
  );
}
