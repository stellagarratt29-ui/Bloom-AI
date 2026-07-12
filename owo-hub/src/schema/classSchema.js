import { WORLDS } from './constants';

export const classSchema = {
  titleKey: 'name',
  fields: [
    { key: 'name', label: 'Class Name', type: 'text', placeholder: 'e.g. Hunter' },
    { key: 'world', label: 'World', type: 'select', options: WORLDS },
    { key: 'icon', label: 'Class Icon / Image', type: 'image' },
    { key: 'startingItems', label: 'Starting Items', type: 'list', placeholder: 'One item per line, e.g.\nBow\n20 Arrows' },
    { key: 'health', label: 'Health', type: 'number', section: 'Starting Stats' },
    { key: 'damage', label: 'Damage', type: 'number', section: 'Starting Stats' },
    { key: 'defense', label: 'Defense', type: 'number', section: 'Starting Stats' },
    { key: 'speed', label: 'Speed', type: 'number', section: 'Starting Stats' },
    { key: 'ability', label: 'Special Ability / Perk', type: 'textarea', fullWidth: true },
    { key: 'weaponProgression', label: 'Weapon Progression', type: 'list', fullWidth: true, placeholder: 'One step per line, e.g.\nBow\nCrossbow\nRevolver' },
    { key: 'unlockCost', label: 'Unlock Cost (coins, 0 = Free)', type: 'number' },
    { key: 'whyFun', label: 'Why Is It Fun?', type: 'textarea', fullWidth: true },
    { key: 'balanceNotes', label: 'Balance Notes', type: 'textarea', fullWidth: true },
    { key: 'lootSource', label: 'Related Loot Drop (boss/enemy that drops this unlock)', type: 'text', fullWidth: true },
  ],
};
