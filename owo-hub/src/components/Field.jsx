import { fileToDataUrl } from '../lib/image';

// Renders one form control based on a schema field definition, and reports
// changes back up via onChange(key, value).
export default function Field({ field, value, onChange }) {
  const { key, label, type, options, placeholder } = field;

  const set = (v) => onChange(key, v);

  if (type === 'textarea') {
    return (
      <textarea
        className="field-input field-textarea"
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => set(e.target.value)}
        rows={4}
      />
    );
  }

  if (type === 'list') {
    return (
      <textarea
        className="field-input field-textarea"
        placeholder={placeholder || 'One item per line'}
        value={Array.isArray(value) ? value.join('\n') : (value ?? '')}
        onChange={(e) => set(e.target.value.split('\n'))}
        onBlur={(e) => set(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
        rows={4}
      />
    );
  }

  if (type === 'select') {
    return (
      <select className="field-input" value={value ?? options[0]} onChange={(e) => set(e.target.value)}>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (type === 'number') {
    return (
      <input
        className="field-input"
        type="number"
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => set(e.target.value === '' ? '' : Number(e.target.value))}
      />
    );
  }

  if (type === 'color') {
    return (
      <div className="field-color-row">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
          onChange={(e) => set(e.target.value)}
        />
        <input
          className="field-input"
          type="text"
          placeholder="#RRGGBB"
          value={value ?? ''}
          onChange={(e) => set(e.target.value)}
        />
      </div>
    );
  }

  if (type === 'image') {
    return (
      <div className="field-image-row">
        {value ? <img src={value} alt="" className="field-image-preview" /> : (
          <div className="field-image-placeholder">No image</div>
        )}
        <div className="field-image-actions">
          <label className="btn btn-small">
            {value ? 'Replace' : 'Upload'}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const dataUrl = await fileToDataUrl(file);
                set(dataUrl);
              }}
            />
          </label>
          {value && (
            <button type="button" className="btn btn-small btn-ghost" onClick={() => set('')}>
              Remove
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <input
      className="field-input"
      type="text"
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(e) => set(e.target.value)}
    />
  );
}
