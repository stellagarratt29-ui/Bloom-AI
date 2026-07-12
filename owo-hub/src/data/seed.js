// Seed data pre-filled from the OWO Developers Hub brief, so the hub isn't
// empty on first load. Everything here is fully editable/deletable in the app.

export const seedClasses = [
  {
    id: 'seed-adventurer',
    name: 'Adventurer', world: 'Forest', icon: '',
    startingItems: ['Map'],
    health: 100, damage: 10, defense: 5, speed: 10,
    ability: 'Balanced all-rounder with no major weaknesses.',
    weaponProgression: [],
    unlockCost: 0,
    whyFun: 'Simple, balanced playstyle great for new players.',
    balanceNotes: 'Default class, kept intentionally average.',
    lootSource: '',
  },
  {
    id: 'seed-hunter',
    name: 'Hunter', world: 'Forest', icon: '',
    startingItems: ['Bow', '20 Arrows'],
    health: 90, damage: 18, defense: 4, speed: 12,
    ability: 'Gets +20% damage to all weapons.',
    weaponProgression: ['Bow', 'Crossbow', 'Revolver'],
    unlockCost: 200,
    whyFun: 'High damage, ranged playstyle with weapon upgrades that get stronger as you level.',
    balanceNotes: 'Lower health balances the high damage output.',
    lootSource: '',
  },
  {
    id: 'seed-chef',
    name: 'Chef', world: 'Forest', icon: '',
    startingItems: ['Cook Pot', '5 Meat'],
    health: 100, damage: 8, defense: 6, speed: 9,
    ability: 'Cooked food heals extra and lasts longer.',
    weaponProgression: [],
    unlockCost: 100,
    whyFun: 'Support-oriented playstyle centered on crafting food buffs for the team.',
    balanceNotes: 'Low damage offset by strong team utility.',
    lootSource: '',
  },
  {
    id: 'seed-veterinarian',
    name: 'Veterinarian', world: 'Forest', icon: '',
    startingItems: ['Tranq Dart', 'Animal Feed'],
    health: 95, damage: 9, defense: 5, speed: 10,
    ability: '30% better chance to tame animals.',
    weaponProgression: [],
    unlockCost: 150,
    whyFun: 'Unlocks animal companions other classes struggle to tame.',
    balanceNotes: 'Taming bonus is situational, not combat-affecting.',
    lootSource: '',
  },
  {
    id: 'seed-weatherman',
    name: 'Weatherman', world: 'Forest', icon: '',
    startingItems: ['Barometer'],
    health: 90, damage: 8, defense: 4, speed: 10,
    ability: 'Can see weather predictions 30 seconds in advance.',
    weaponProgression: [],
    unlockCost: 150,
    whyFun: 'Niche utility class for planning around weather-based hazards and events.',
    balanceNotes: 'Purely informational perk, no direct combat impact.',
    lootSource: '',
  },
];

export const seedAnimals = [
  {
    id: 'seed-deer',
    name: 'Deer', world: 'Forest', xpReward: 15,
    coinMin: 30, coinMax: 50, specialDrops: '',
    difficulty: 'Low', healthPool: 'Small',
  },
  {
    id: 'seed-bear',
    name: 'Bear', world: 'Forest', xpReward: 500,
    coinMin: 200, coinMax: 300, specialDrops: 'Bear Trophy (needed to unlock Jurassic)',
    difficulty: 'Very High', healthPool: 'Boss-sized',
  },
];

export const seedItems = [
  {
    id: 'seed-deer-meat',
    name: 'Deer Meat', source: 'Deer', coinValue: 10,
    rarity: 'Common', craftingUses: 'Used to cook food',
  },
  {
    id: 'seed-bear-trophy',
    name: 'Bear Trophy', source: 'Bear Boss', coinValue: 0,
    rarity: 'Legendary', craftingUses: 'Required to unlock the Jurassic world',
  },
];

export const seedGamePasses = [
  {
    id: 'seed-double-xp',
    name: 'Double XP Pass', robuxCost: 500,
    grants: '2x experience gained from all sources', duration: '30 days',
  },
];

export const seedXpLevels = [
  { id: 'seed-lvl-1', level: 1, xpRequired: 0, cumulativeXp: 0, milestoneReward: '' },
  { id: 'seed-lvl-2', level: 2, xpRequired: 100, cumulativeXp: 100, milestoneReward: '' },
  { id: 'seed-lvl-3', level: 3, xpRequired: 150, cumulativeXp: 250, milestoneReward: '' },
];

export const seedRevenueScenarios = [
  {
    id: 'seed-rev-100',
    scenarioName: '100 Players', playerCount: 100,
    spendPercent: 5, avgSpendRobux: 500, devExRate: 100,
    notes: 'Early-launch baseline scenario.',
  },
  {
    id: 'seed-rev-1000',
    scenarioName: '1,000 Players', playerCount: 1000,
    spendPercent: 5, avgSpendRobux: 500, devExRate: 100,
    notes: 'Growth-phase scenario.',
  },
];

export const seedLocations = [
  {
    id: 'seed-bear-cave',
    name: 'Bear Cave', world: 'Forest', biome: 'Mountain Cave System',
    description: 'A massive cave entrance carved into snowy peaks. Inside are 2 smaller caves branching off. The center arena is where the Bear Boss spawns.',
    whatsThere: ['Cave entrance', 'Smaller tunnels', 'Altar', 'Boss arena'],
    enemies: ['Bears (regular)', 'Bear Boss (final boss)'],
    loot: ['Bear meat', 'Bones', 'Bear trophies', 'Rare herbs', 'Ancient relics'],
    resources: ['Stone', 'Cave mushrooms'],
    difficulty: 'Very High', size: 'Large',
    coordinates: 'Far North of map', travelTime: '15-20 minutes from spawn',
    specialFeatures: 'Only location with Bear Boss, required to unlock Jurassic',
    image: '',
  },
];

export const seedBosses = [
  {
    id: 'seed-bear-boss',
    bossName: 'Bear', arenaName: "Bear's Domain", arenaSize: 'Large',
    layout: 'A massive open clearing surrounded by tall trees and cliffs. Rocky terrain with some boulders for cover. A small stream runs through the middle. The Bear spawns in the center of the clearing.',
    mechanics: [
      'Charges at players in straight lines (dodge to sides)',
      'Roars to stun nearby players',
      'Swipes with claws (moderate damage, wide arc)',
      'Phase 2: Gets faster and angrier at 50% health',
    ],
    weakness: 'More vulnerable after charging (recovery time)',
    healthPool: 'High', damageOutput: 'Very High', speed: 'Fast', attackFrequency: 'Moderate',
    visualStyle: 'Natural forest clearing, earthy tones, dramatic lighting from sunset/sunrise, Bear is massive and intimidating',
    strategy: 'Use ranged attacks to stay safe, dodge charges by rolling to the side, attack during recovery time after charges',
    image: '',
  },
  {
    id: 'seed-trex-boss',
    bossName: 'King T-Rex', arenaName: 'T-Rex Territory / DNA Lab Arena', arenaSize: 'Very Large',
    layout: 'An open arena inside the DNA Lab facility. Futuristic platform in the center surrounded by lava pits. High-tech pillars for cover. Ground shakes and trembles. The T-Rex roars and approaches from the east side of the arena.',
    mechanics: [
      'Charges across the arena (destroys terrain)',
      'Tail whips (massive AOE damage)',
      'Roar attack (stuns + damages)',
      'Phase 2 at 50% health: Becomes even more aggressive, adds fire breath attack',
    ],
    weakness: 'Slow turning radius, vulnerable to attacks from the side',
    healthPool: 'Extremely High', damageOutput: 'Massive', speed: 'Fast (poor turning)', attackFrequency: 'High',
    visualStyle: 'Futuristic laboratory with volcanic elements, bright neon colors, lava glow, epic and intimidating',
    strategy: 'Keep moving to avoid charges, use Dino Tamer class to reduce damage, attack from the sides, avoid lava pits',
    image: '',
  },
  {
    id: 'seed-king-of-ocean-boss',
    bossName: 'King of Ocean', arenaName: "Poseidon's Palace / Ocean Throne Room", arenaSize: 'Very Large',
    layout: 'A massive underwater palace chamber. Golden columns and archways. Water currents that push players around. Multiple levels (can move up/down). Coral formations for cover. The King of Ocean summoned at the center.',
    mechanics: [
      'Summons water tentacles (grab and pull damage)',
      'Creates whirlpools (pull players inward, hard to escape)',
      'Tidal wave attack (massive damage, entire arena)',
      'Summons sea creatures to aid in battle',
      'Phase 2 at 50%: Water becomes more chaotic, harder to move',
    ],
    weakness: 'Lightning-based attacks deal extra damage',
    healthPool: 'Extreme', damageOutput: 'High', speed: 'Moderate', attackFrequency: 'High (multiple adds)',
    visualStyle: 'Golden palace, bioluminescent creatures, deep blue water, majestic and mysterious, glowing effects',
    strategy: 'Use Poseidon class with trident, stay mobile, avoid center of whirlpools, use lightning-based attacks when possible, watch for tentacle patterns',
    image: '',
  },
  {
    id: 'seed-zeus-boss',
    bossName: 'Zeus', arenaName: "Zeus's Throne Room / Peak of Olympus", arenaSize: 'Enormous',
    layout: 'A massive floating arena at the top of Mount Olympus. Marble platform with golden accents. Multiple sky platforms at different heights (can jump between them). Lightning strikes randomly. Storm clouds everywhere. Zeus sits on throne at center until battle starts.',
    mechanics: [
      'Lightning bolt attacks from hands (extreme damage)',
      'Calls down lightning strikes from sky (AOE, unpredictable)',
      'Thunder shockwave (pushes players back)',
      'Flight attack (zooms across arena)',
      'Phase 2 at 50%: Lightning becomes constant, platforms start crumbling',
      'Phase 3 at 25%: ENRAGE mode - attacks become incredibly fast and frequent',
    ],
    weakness: 'Can be stunned by crowd control abilities',
    healthPool: 'Extreme', damageOutput: 'Extreme', speed: 'Fastest boss in game', attackFrequency: 'Constant (phase 3)',
    visualStyle: 'Heavenly palace, bright gold and white, constant lightning effects, dramatic storm, epic and godly',
    strategy: 'Use Hercules class for survivability, master platform jumping, stay mobile constantly, learn to predict lightning patterns, use crowd control to stun during most dangerous attacks, bring maximum healing items',
    image: '',
  },
];

export const seedDevTasks = [
  { id: 'seed-dt-1', name: 'Terrain Base', world: 'Forest', priority: 1, estimatedTime: '5-6 hours', status: 'Not Started', description: 'Build the basic terrain blocks (grass, dirt, stone).', breakdown: ['Mountains in north', 'Flat areas in center', 'Rivers running through'] },
  { id: 'seed-dt-2', name: 'Forest Locations', world: 'Forest', priority: 2, estimatedTime: '8-10 hours', status: 'Not Started', description: 'Build all 15 named locations.', breakdown: ['Forest Village (2h)', 'Bear Cave (2h)', 'Lumber Camp (1h)'] },
  { id: 'seed-dt-3', name: 'Trees & Vegetation', world: 'Forest', priority: 3, estimatedTime: '3-4 hours', status: 'Not Started', description: 'Place trees, bushes, grass everywhere.', breakdown: [] },
  { id: 'seed-dt-4', name: 'NPCs & Spawn Points', world: 'Forest', priority: 4, estimatedTime: '2-3 hours', status: 'Not Started', description: 'Place NPC characters, player spawn location.', breakdown: [] },
  { id: 'seed-dt-5', name: 'Workbenches & Crafting Stations', world: 'Forest', priority: 5, estimatedTime: '2 hours', status: 'Not Started', description: 'Crafting benches, campfires, upgrade stations.', breakdown: [] },
  { id: 'seed-dt-6', name: 'Loot Spawners & Chests', world: 'Forest', priority: 6, estimatedTime: '2-3 hours', status: 'Not Started', description: 'Place chests with loot, animal spawn points.', breakdown: [] },
  { id: 'seed-dt-7', name: 'Weather System Scripts', world: 'Forest', priority: 7, estimatedTime: '3-4 hours', status: 'Not Started', description: 'Code the weather system (rain, fog, lightning, etc.).', breakdown: [] },
  { id: 'seed-dt-8', name: 'Combat Scripts', world: 'Forest', priority: 8, estimatedTime: '5-6 hours', status: 'Not Started', description: 'Enemy AI, damage system, health management.', breakdown: [] },
  { id: 'seed-dt-9', name: 'Bear Boss Arena & Scripts', world: 'Forest', priority: 9, estimatedTime: '4-5 hours', status: 'Not Started', description: 'Boss arena, Bear AI, boss mechanics.', breakdown: [] },
  { id: 'seed-dt-10', name: 'Testing & Polish', world: 'Forest', priority: 10, estimatedTime: '4-6 hours', status: 'Not Started', description: 'Playtest, fix bugs, optimize performance.', breakdown: [] },
];

export const seedTimeline = {
  designPhase: '1-2 weeks (done in parallel with building checklist creation)',
  macArrives: '1-2 weeks',
  forestConstruction: '4-6 weeks',
  forestLaunch: '~2-3 months from now',
};

export const seedPalette = [
  { id: 'seed-c-1', group: 'Forest', name: 'Grass/Ground', hex: '#2D5016' },
  { id: 'seed-c-2', group: 'Forest', name: 'Dirt/Paths', hex: '#8B7355' },
  { id: 'seed-c-3', group: 'Forest', name: 'Rock/Stone', hex: '#A9A9A9' },
  { id: 'seed-c-4', group: 'Forest', name: 'Water', hex: '#1E90FF' },
  { id: 'seed-c-5', group: 'Forest', name: 'Tree Bark', hex: '#654321' },
  { id: 'seed-c-6', group: 'Forest', name: 'Tree Leaves', hex: '#228B22' },
  { id: 'seed-c-7', group: 'Forest', name: 'Wood Structures', hex: '#D2B48C' },
  { id: 'seed-c-8', group: 'Forest', name: 'Caves', hex: '#2F4F4F' },
  { id: 'seed-c-9', group: 'DNA Lab', name: 'Primary', hex: '#00CED1' },
  { id: 'seed-c-10', group: 'DNA Lab', name: 'Secondary', hex: '#00FF00' },
  { id: 'seed-c-11', group: 'DNA Lab', name: 'Accent', hex: '#FFD700' },
  { id: 'seed-c-12', group: 'DNA Lab', name: 'Base', hex: '#2F4F4F' },
  { id: 'seed-c-13', group: 'UI/HUD', name: 'Health Bar', hex: '#00FF00' },
  { id: 'seed-c-14', group: 'UI/HUD', name: 'XP Bar', hex: '#0087FF' },
  { id: 'seed-c-15', group: 'UI/HUD', name: 'Coin Counter', hex: '#FFD700' },
  { id: 'seed-c-16', group: 'UI/HUD', name: 'Level Text', hex: '#FFFF00' },
  { id: 'seed-c-17', group: 'UI/HUD', name: 'Objective Text', hex: '#FFFFFF' },
  { id: 'seed-c-18', group: 'UI/HUD', name: 'Text Shadows', hex: '#000000' },
  { id: 'seed-c-19', group: 'Jurassic', name: 'Volcano', hex: '#FF4500' },
  { id: 'seed-c-20', group: 'Jurassic', name: 'Lava', hex: '#FF8C00' },
  { id: 'seed-c-21', group: 'Jurassic', name: 'Jungle', hex: '#006400' },
  { id: 'seed-c-22', group: 'Jurassic', name: 'Bones/Fossils', hex: '#F5DEB3' },
  { id: 'seed-c-23', group: 'Atlantis', name: 'Deep Water', hex: '#001F3F' },
  { id: 'seed-c-24', group: 'Atlantis', name: 'Coral', hex: '#FF6347' },
  { id: 'seed-c-25', group: 'Atlantis', name: 'Golden Structures', hex: '#FFD700' },
  { id: 'seed-c-26', group: 'Atlantis', name: 'Bioluminescence', hex: '#00FF00' },
  { id: 'seed-c-27', group: 'Mount Olympus', name: 'Marble', hex: '#FFFACD' },
  { id: 'seed-c-28', group: 'Mount Olympus', name: 'Gold', hex: '#FFD700' },
  { id: 'seed-c-29', group: 'Mount Olympus', name: 'Lightning', hex: '#FFFF00' },
  { id: 'seed-c-30', group: 'Mount Olympus', name: 'Sky', hex: '#87CEEB' },
];

export const seedTypography = {
  fontChoices: '',
  buttonStyles: '',
  menuDesign: '',
  loadingScreenAesthetic: '',
  overallStyle: 'Chunky Roblox aesthetic',
};
