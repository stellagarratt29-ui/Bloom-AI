import { STYLE_PRESETS } from './catalog';

const NAMES = ['Marin', 'Sasha K.', 'Théo B.', 'Priya', 'Jonas', 'Amara', 'Léa', 'Wren', 'Ines', 'Kaito', 'Nora', 'Dev'];

function seedBuilds(count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const style = STYLE_PRESETS[i % STYLE_PRESETS.length];
    out.push({
      id: `build-${i}`,
      title: `${style.name} ${['Retreat', 'Residence', 'House', 'Cottage', 'Villa', 'Loft'][i % 6]}`,
      author: NAMES[i % NAMES.length],
      style: style.name,
      accent: style.accent,
      likes: Math.floor(40 + Math.sin(i * 13.1) * 30 + i * 7) % 900 + 20,
      saves: Math.floor(10 + i * 4.3) % 300 + 5,
      isNew: i % 5 === 0,
      liked: false,
      saved: false,
    });
  }
  return out;
}

export const COMMUNITY_BUILDS = seedBuilds(24);

export const DESIGN_CHALLENGES = [
  { id: 'c1', title: 'Dream Kitchen Challenge', desc: 'Design a kitchen that makes people want to cook.', endsInDays: 3, entries: 214, prize: 'Featured on Home screen' },
  { id: 'c2', title: 'Best Backyard', desc: 'Build the outdoor space you never want to leave.', endsInDays: 6, entries: 132, prize: 'Exclusive landscaping pack' },
  { id: 'c3', title: 'Coastal Home Contest', desc: 'Bring the California coast to life.', endsInDays: 1, entries: 341, prize: 'Featured globally' },
  { id: 'c4', title: 'Small Space Design', desc: 'Maximize charm in under 400 sq ft.', endsInDays: 9, entries: 88, prize: 'Tiny Home furniture set' },
  { id: 'c5', title: 'Luxury Bathroom Competition', desc: 'Spa-level bathrooms only.', endsInDays: 12, entries: 61, prize: 'Marble material pack' },
];

export const MARKETPLACE_PACKS = [
  { id: 'm1', name: 'Coastal Living Collection', category: 'Furniture', itemCount: 32, price: 0, owned: true },
  { id: 'm2', name: 'Mountain Lodge Materials', category: 'Materials', itemCount: 18, price: 400, owned: false },
  { id: 'm3', name: 'French Country Architecture', category: 'Architecture', itemCount: 24, price: 600, owned: false },
  { id: 'm4', name: 'Seasonal: Autumn Decor', category: 'Seasonal', itemCount: 15, price: 200, owned: false },
  { id: 'm5', name: 'Landscape Pack: Vineyards', category: 'Landscape', itemCount: 20, price: 500, owned: false },
  { id: 'm6', name: 'Modern Lighting Collection', category: 'Lighting', itemCount: 12, price: 300, owned: false },
  { id: 'm7', name: 'Luxury Estate Bundle', category: 'Architecture', itemCount: 40, price: 900, owned: false },
  { id: 'm8', name: 'Minimalist Essentials', category: 'Furniture', itemCount: 22, price: 0, owned: true },
];

export const INSPIRATION_ITEMS = seedBuilds(30).map((b, i) => ({
  ...b,
  id: `insp-${i}`,
  category: STYLE_PRESETS[i % STYLE_PRESETS.length].name,
}));

export const FRIENDS = [
  { id: 'f1', name: 'Sasha K.', status: 'Building a coastal villa', online: true },
  { id: 'f2', name: 'Théo B.', status: 'Last seen 2h ago', online: false },
  { id: 'f3', name: 'Priya', status: 'Editing a mountain lodge', online: true },
  { id: 'f4', name: 'Wren', status: 'Last seen yesterday', online: false },
  { id: 'f5', name: 'Kaito', status: 'Hosting an open house', online: true },
];

export const MESSAGES = [
  { id: 'msg1', from: 'Sasha K.', preview: 'Love what you did with the kitchen island!', time: '2m' },
  { id: 'msg2', from: 'Priya', preview: 'Want to collab on the lake house?', time: '1h' },
  { id: 'msg3', from: 'Kaito', preview: 'Come see my open house tonight', time: '3h' },
];

export const NOTIFICATIONS = [
  { id: 'n1', text: 'Sasha K. liked your Coastal Cottage', time: '5m', icon: 'heart' },
  { id: 'n2', text: 'Your build was featured in Explore', time: '1h', icon: 'award' },
  { id: 'n3', text: 'Dream Kitchen Challenge ends tomorrow', time: '4h', icon: 'clock' },
  { id: 'n4', text: 'Théo B. started following you', time: '1d', icon: 'user' },
];
