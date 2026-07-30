import { useState } from 'react';
import CrudList from '../components/CrudList';
import { useCollection } from '../lib/useCollection';
import {
  animalSchema, itemSchema, gamePassSchema, xpLevelSchema, revenueScenarioSchema,
} from '../schema/economySchemas';
import {
  seedAnimals, seedItems, seedGamePasses, seedXpLevels, seedRevenueScenarios, seedClasses,
} from '../data/seed';
import { WORLDS } from '../schema/constants';

const TABS = ['Animal Loot Table', 'Item Loot Table', 'Class Unlock Prices', 'Game Passes & Monetization', 'XP Progression', 'Revenue Projections'];

function AnimalLootTable() {
  const { items, addItem, updateItem, deleteItem, deleteMany } = useCollection('animals', seedAnimals);
  return (
    <CrudList
      schema={animalSchema}
      items={items}
      onAdd={addItem}
      onUpdate={updateItem}
      onDelete={deleteItem}
      onDeleteMany={deleteMany}
      addLabel="Add Animal"
      emptyLabel="No animals logged yet."
      newRecordDefaults={{ world: WORLDS[0], difficulty: 'Low' }}
      renderCard={(a) => (
        <>
          <h3 className="card-title">{a.name}</h3>
          <div className="card-badges">
            <span className="badge">{a.world}</span>
            <span className="badge">{a.difficulty}</span>
          </div>
          <div className="stat-row">
            <span className="stat-pill">XP <b>{a.xpReward}</b></span>
            <span className="stat-pill">Coins <b>{a.coinMin}-{a.coinMax}</b></span>
          </div>
          {a.specialDrops && <p className="card-line">Special drop: {a.specialDrops}</p>}
          {a.healthPool && <p className="card-line">Size/HP: {a.healthPool}</p>}
        </>
      )}
    />
  );
}

function ItemLootTable() {
  const { items, addItem, updateItem, deleteItem, deleteMany } = useCollection('items', seedItems);
  return (
    <CrudList
      schema={itemSchema}
      items={items}
      onAdd={addItem}
      onUpdate={updateItem}
      onDelete={deleteItem}
      onDeleteMany={deleteMany}
      addLabel="Add Item"
      emptyLabel="No items logged yet."
      newRecordDefaults={{ rarity: 'Common' }}
      renderCard={(it) => (
        <>
          <h3 className="card-title">{it.name}</h3>
          <div className="card-badges">
            <span className="badge">{it.rarity}</span>
            <span className="badge badge-accent">{it.coinValue} coins</span>
          </div>
          {it.source && <p className="card-line">Source: {it.source}</p>}
          {it.craftingUses && <p className="card-line">{it.craftingUses}</p>}
        </>
      )}
    />
  );
}

function ClassUnlockPrices() {
  // Derived read-only view: unlock cost already lives on each class record,
  // so this reads the same "classes" collection instead of duplicating data.
  const { items } = useCollection('classes', seedClasses);
  const sorted = [...items].sort((a, b) => (a.unlockCost || 0) - (b.unlockCost || 0));
  return (
    <div>
      <p className="card-line" style={{ marginBottom: 16 }}>
        Read-only &mdash; edit a class's "Unlock Cost" field on the Classes page to change its price here.
      </p>
      {WORLDS.map((world) => {
        const inWorld = sorted.filter((c) => c.world === world);
        if (inWorld.length === 0) return null;
        return (
          <div key={world}>
            <div className="color-group-title">{world}</div>
            <div className="card-grid" style={{ marginBottom: 12 }}>
              {inWorld.map((c) => (
                <div key={c.id} className="item-card">
                  <h3 className="card-title">{c.name}</h3>
                  <span className="badge badge-accent">{c.unlockCost ? `${c.unlockCost} coins` : 'Free'}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GamePasses() {
  const { items, addItem, updateItem, deleteItem, deleteMany } = useCollection('gamepasses', seedGamePasses);
  return (
    <CrudList
      schema={gamePassSchema}
      items={items}
      onAdd={addItem}
      onUpdate={updateItem}
      onDelete={deleteItem}
      onDeleteMany={deleteMany}
      addLabel="Add Game Pass"
      emptyLabel="No game passes yet."
      renderCard={(g) => (
        <>
          <h3 className="card-title">{g.name}</h3>
          <span className="badge badge-accent">{g.robuxCost} Robux</span>
          {g.grants && <p className="card-line">{g.grants}</p>}
          {g.duration && <p className="card-line">Duration: {g.duration}</p>}
        </>
      )}
    />
  );
}

function XpProgression() {
  const { items, addItem, updateItem, deleteItem, deleteMany } = useCollection('xplevels', seedXpLevels);
  const sorted = [...items].sort((a, b) => (a.level || 0) - (b.level || 0));
  return (
    <CrudList
      schema={xpLevelSchema}
      items={sorted}
      onAdd={addItem}
      onUpdate={updateItem}
      onDelete={deleteItem}
      onDeleteMany={deleteMany}
      addLabel="Add Level"
      emptyLabel="No levels defined yet."
      renderCard={(l) => (
        <>
          <h3 className="card-title">Level {l.level}</h3>
          <div className="stat-row">
            <span className="stat-pill">XP needed <b>{l.xpRequired}</b></span>
            <span className="stat-pill">Cumulative <b>{l.cumulativeXp}</b></span>
          </div>
          {l.milestoneReward && <p className="card-line">Milestone: {l.milestoneReward}</p>}
        </>
      )}
    />
  );
}

function RevenueProjections() {
  const { items, addItem, updateItem, deleteItem, deleteMany } = useCollection('revenue', seedRevenueScenarios);
  return (
    <CrudList
      schema={revenueScenarioSchema}
      items={items}
      onAdd={addItem}
      onUpdate={updateItem}
      onDelete={deleteItem}
      onDeleteMany={deleteMany}
      addLabel="Add Scenario"
      emptyLabel="No revenue scenarios yet."
      renderCard={(r) => {
        const payingPlayers = Math.round((r.playerCount || 0) * ((r.spendPercent || 0) / 100));
        const totalRobux = payingPlayers * (r.avgSpendRobux || 0);
        const usd = r.devExRate ? (totalRobux / r.devExRate).toFixed(2) : null;
        return (
          <>
            <h3 className="card-title">{r.scenarioName}</h3>
            <div className="stat-row">
              <span className="stat-pill">Players <b>{r.playerCount}</b></span>
              <span className="stat-pill">Paying <b>{payingPlayers}</b></span>
            </div>
            <p className="card-line">Est. revenue: <b>{totalRobux.toLocaleString()} Robux</b>{usd ? ` (~$${usd})` : ''}</p>
            {r.notes && <p className="card-line">{r.notes}</p>}
          </>
        );
      }}
    />
  );
}

export default function EconomyPage() {
  const [tab, setTab] = useState(TABS[0]);
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Economy</h1>
        <p className="page-subtitle">How players earn, spend, and progress through the game.</p>
      </div>
      <div className="tab-row">
        {TABS.map((t) => (
          <button key={t} className={'tab-btn' + (tab === t ? ' tab-btn-active' : '')} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Animal Loot Table' && <AnimalLootTable />}
      {tab === 'Item Loot Table' && <ItemLootTable />}
      {tab === 'Class Unlock Prices' && <ClassUnlockPrices />}
      {tab === 'Game Passes & Monetization' && <GamePasses />}
      {tab === 'XP Progression' && <XpProgression />}
      {tab === 'Revenue Projections' && <RevenueProjections />}
    </div>
  );
}
