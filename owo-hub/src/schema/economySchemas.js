import { WORLDS, DIFFICULTIES, RARITIES } from './constants';

export const animalSchema = {
  titleKey: 'name',
  fields: [
    { key: 'name', label: 'Animal Name', type: 'text' },
    { key: 'world', label: 'World', type: 'select', options: WORLDS },
    { key: 'xpReward', label: 'XP Reward', type: 'number' },
    { key: 'coinMin', label: 'Coin Drop Min', type: 'number' },
    { key: 'coinMax', label: 'Coin Drop Max', type: 'number' },
    { key: 'specialDrops', label: 'Special Drops', type: 'text', fullWidth: true },
    { key: 'difficulty', label: 'Difficulty Level', type: 'select', options: DIFFICULTIES },
    { key: 'healthPool', label: 'Size / Health Pool', type: 'text' },
  ],
};

export const itemSchema = {
  titleKey: 'name',
  fields: [
    { key: 'name', label: 'Item Name', type: 'text' },
    { key: 'source', label: 'Source (animal/location)', type: 'text' },
    { key: 'coinValue', label: 'Coin Value', type: 'number' },
    { key: 'rarity', label: 'Rarity', type: 'select', options: RARITIES },
    { key: 'craftingUses', label: 'Crafting Uses', type: 'textarea', fullWidth: true },
  ],
};

export const gamePassSchema = {
  titleKey: 'name',
  fields: [
    { key: 'name', label: 'Game Pass Name', type: 'text' },
    { key: 'robuxCost', label: 'Cost in Robux', type: 'number' },
    { key: 'grants', label: 'What It Gives The Player', type: 'textarea', fullWidth: true },
    { key: 'duration', label: 'Duration (monthly / permanent)', type: 'text' },
  ],
};

export const xpLevelSchema = {
  titleKey: 'level',
  fields: [
    { key: 'level', label: 'Level Number', type: 'number' },
    { key: 'xpRequired', label: 'XP Required For This Level', type: 'number' },
    { key: 'cumulativeXp', label: 'Cumulative XP Total', type: 'number' },
    { key: 'milestoneReward', label: 'Milestone Reward (if any)', type: 'text', fullWidth: true },
  ],
};

export const revenueScenarioSchema = {
  titleKey: 'scenarioName',
  fields: [
    { key: 'scenarioName', label: 'Scenario Name', type: 'text', placeholder: 'e.g. 1,000 players' },
    { key: 'playerCount', label: 'Player Count', type: 'number' },
    { key: 'spendPercent', label: '% of Players Who Spend', type: 'number' },
    { key: 'avgSpendRobux', label: 'Avg Spend per Paying Player (Robux)', type: 'number' },
    { key: 'devExRate', label: 'DevEx Rate (Robux per $1 USD)', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
  ],
};
