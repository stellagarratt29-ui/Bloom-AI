import { useState } from 'react';
import Field from './Field';

// Generic modal form: renders one input per schema field, grouped by
// field.section when present, and reports back a full record on save.
export default function CrudForm({ schema, initial, title, onSave, onClose }) {
  const [draft, setDraft] = useState(() => initial ?? {});

  const setField = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  // Group fields into contiguous runs by section, preserving schema order
  // (a field with no section resumes the previous unnamed run rather than
  // being pulled together with unrelated unnamed fields elsewhere).
  const sections = [];
  for (const f of schema.fields) {
    const sec = f.section || null;
    const current = sections[sections.length - 1];
    if (!current || current.name !== sec) {
      sections.push({ name: sec, fields: [f] });
    } else {
      current.fields.push(f);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <div className="modal-body">
          {sections.map((section, idx) => (
            <div key={idx} className="field-section">
              {section.name && <div className="field-section-title">{section.name}</div>}
              <div className="field-grid">
                {section.fields.map((f) => (
                  <div key={f.key} className={f.fullWidth ? 'field-wrap field-wrap-full' : 'field-wrap'}>
                    <label className="field-label">{f.label}</label>
                    <Field field={f} value={draft[f.key]} onChange={setField} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(draft)}>Save</button>
        </div>
      </div>
    </div>
  );
}
