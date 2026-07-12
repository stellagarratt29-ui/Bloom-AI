import { SIZES } from './constants';

export const bossSchema = {
  titleKey: 'bossName',
  fields: [
    { key: 'bossName', label: 'Boss Name', type: 'text' },
    { key: 'arenaName', label: 'Arena Name', type: 'text' },
    { key: 'arenaSize', label: 'Arena Size', type: 'select', options: SIZES.concat(['Very Large', 'Enormous']) },
    { key: 'layout', label: 'Arena Layout', type: 'textarea', fullWidth: true },
    { key: 'mechanics', label: 'Boss Mechanics', type: 'list', fullWidth: true },
    { key: 'weakness', label: 'Weakness', type: 'text', fullWidth: true },
    { key: 'healthPool', label: 'Health Pool', type: 'text' },
    { key: 'damageOutput', label: 'Damage Output', type: 'text' },
    { key: 'speed', label: 'Speed / Agility', type: 'text' },
    { key: 'attackFrequency', label: 'Attack Frequency', type: 'text' },
    { key: 'visualStyle', label: 'Visual Style', type: 'textarea', fullWidth: true },
    { key: 'strategy', label: 'Recommended Strategy', type: 'textarea', fullWidth: true },
    { key: 'image', label: 'Reference Image', type: 'image' },
  ],
};
