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
  renderCard,
  emptyLabel = 'Nothing here yet.',
  addLabel = 'Add New',
  newRecordDefaults = {},
}) {
  const [editing, setEditing] = useState(null); // { mode: 'add'|'edit', item }
  const [pendingDelete, setPendingDelete] = useState(null);

  const closeForm = () => setEditing(null);

  const handleSave = (draft) => {
    if (editing.mode === 'add') {
      onAdd(draft);
    } else {
      onUpdate(editing.item.id, draft);
    }
    closeForm();
  };

  return (
    <div>
      <div className="section-toolbar">
        <button className="btn btn-primary" onClick={() => setEditing({ mode: 'add', item: newRecordDefaults })}>
          + {addLabel}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">{emptyLabel}</div>
      ) : (
        <div className="card-grid">
          {items.map((item) => (
            <div key={item.id} className="item-card">
              {renderCard(item)}
              <div className="item-card-actions">
                <button className="btn btn-small" onClick={() => setEditing({ mode: 'edit', item })}>Edit</button>
                <button className="btn btn-small btn-ghost" onClick={() => setPendingDelete(item)}>Delete</button>
              </div>
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
    </div>
  );
}
