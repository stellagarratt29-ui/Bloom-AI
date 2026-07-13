import { useState } from 'react';
import CrudList from '../components/CrudList';
import { paletteColorSchema, referenceImageSchema } from '../schema/devTaskSchema';
import { seedPalette, seedTypography } from '../data/seed';
import { useCollection } from '../lib/useCollection';
import { useRecord } from '../lib/useRecord';

const TABS = ['Color Palettes', 'Reference Images', 'Typography & Design'];

function ColorPalettes() {
  const { items, addItem, updateItem, deleteItem, deleteMany } = useCollection('palette', seedPalette);
  const groups = [...new Set(items.map((c) => c.group))];

  return (
    <div>
      <div className="section-toolbar">
        <button className="btn btn-primary" onClick={() => addItem({ group: 'Forest', name: '', hex: '#000000' })}>
          + Quick Add Color
        </button>
      </div>
      {groups.length === 0 && <div className="empty-state">No colors defined yet.</div>}
      {groups.map((group) => (
        <div key={group}>
          <div className="color-group-title">{group}</div>
          <ColorGroupList
            group={group}
            items={items.filter((c) => c.group === group)}
            onAdd={addItem}
            onUpdate={updateItem}
            onDelete={deleteItem}
            onDeleteMany={deleteMany}
          />
        </div>
      ))}
    </div>
  );
}

function ColorGroupList({ group, items, onAdd, onUpdate, onDelete, onDeleteMany }) {
  return (
    <CrudList
      schema={paletteColorSchema}
      items={items}
      onAdd={(record) => onAdd({ ...record, group })}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onDeleteMany={onDeleteMany}
      addLabel="Add Color"
      newRecordDefaults={{ group, hex: '#000000' }}
      emptyLabel="No colors in this group."
      renderCard={(c) => (
        <div className="color-swatch-row">
          <div className="color-swatch" style={{ background: c.hex }} />
          <div>
            <div className="card-title" style={{ fontSize: 14 }}>{c.name}</div>
            <div className="card-line">{c.hex}</div>
          </div>
        </div>
      )}
    />
  );
}

function ReferenceImages() {
  const { items, addItem, updateItem, deleteItem, deleteMany } = useCollection('referenceImages', []);
  return (
    <CrudList
      schema={referenceImageSchema}
      items={items}
      onAdd={addItem}
      onUpdate={updateItem}
      onDelete={deleteItem}
      onDeleteMany={deleteMany}
      addLabel="Add Reference Image"
      emptyLabel="No reference images uploaded yet. Upload mood/atmosphere images for each world here."
      renderCard={(img) => (
        <>
          {img.image ? <img src={img.image} alt={img.caption} className="card-thumb" /> : (
            <div className="card-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              No image
            </div>
          )}
          <h3 className="card-title" style={{ fontSize: 14 }}>{img.caption || 'Untitled'}</h3>
          <span className="badge">{img.group}</span>
        </>
      )}
    />
  );
}

function TypographyAndDesign() {
  const [notes, update] = useRecord('typography', seedTypography);
  return (
    <div className="simple-form">
      <div>
        <label className="field-label">Font Choices</label>
        <textarea className="field-input field-textarea" rows={2} value={notes.fontChoices}
          onChange={(e) => update({ fontChoices: e.target.value })} placeholder="Heading font, body font, etc." />
      </div>
      <div>
        <label className="field-label">Button Styles</label>
        <textarea className="field-input field-textarea" rows={2} value={notes.buttonStyles}
          onChange={(e) => update({ buttonStyles: e.target.value })} />
      </div>
      <div>
        <label className="field-label">Menu Design</label>
        <textarea className="field-input field-textarea" rows={2} value={notes.menuDesign}
          onChange={(e) => update({ menuDesign: e.target.value })} />
      </div>
      <div>
        <label className="field-label">Loading Screen Aesthetic</label>
        <textarea className="field-input field-textarea" rows={2} value={notes.loadingScreenAesthetic}
          onChange={(e) => update({ loadingScreenAesthetic: e.target.value })} />
      </div>
      <div>
        <label className="field-label">Overall Style (chunky Roblox vs detailed vs minimalist)</label>
        <textarea className="field-input field-textarea" rows={2} value={notes.overallStyle}
          onChange={(e) => update({ overallStyle: e.target.value })} />
      </div>
    </div>
  );
}

export default function VisualGuidePage() {
  const [tab, setTab] = useState(TABS[0]);
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Visual Guide</h1>
        <p className="page-subtitle">The complete visual identity and aesthetic of the game.</p>
      </div>
      <div className="tab-row">
        {TABS.map((t) => (
          <button key={t} className={'tab-btn' + (tab === t ? ' tab-btn-active' : '')} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Color Palettes' && <ColorPalettes />}
      {tab === 'Reference Images' && <ReferenceImages />}
      {tab === 'Typography & Design' && <TypographyAndDesign />}
    </div>
  );
}
