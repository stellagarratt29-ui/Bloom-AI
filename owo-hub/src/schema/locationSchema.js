import { DIFFICULTIES, SIZES } from './constants';

export const locationSchema = {
  titleKey: 'name',
  fields: [
    { key: 'name', label: 'Location Name', type: 'text' },
    { key: 'biome', label: 'Biome Type', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
    { key: 'whatsThere', label: "What's There (buildings, NPCs, features)", type: 'list', fullWidth: true },
    { key: 'enemies', label: 'Enemies That Spawn', type: 'list', fullWidth: true },
    { key: 'loot', label: 'Loot Available', type: 'list', fullWidth: true },
    { key: 'resources', label: 'Resources', type: 'list' },
    { key: 'difficulty', label: 'Difficulty Level', type: 'select', options: DIFFICULTIES },
    { key: 'size', label: 'Size', type: 'select', options: SIZES },
    { key: 'coordinates', label: 'Map Coordinates', type: 'text' },
    { key: 'travelTime', label: 'Travel Time From Spawn', type: 'text' },
    { key: 'specialFeatures', label: 'Special Features', type: 'textarea', fullWidth: true },
    { key: 'image', label: 'Reference Image', type: 'image' },
  ],
};
