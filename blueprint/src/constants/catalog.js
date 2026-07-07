// Blueprint's building & furnishing catalog. Every piece is pre-designed to
// pair with everything else in its category, so any combination looks intentional.

export const FURNITURE_CATEGORIES = [
  { id: 'living',   name: 'Living',    icon: 'home' },
  { id: 'kitchen',  name: 'Kitchen',   icon: 'grid' },
  { id: 'dining',   name: 'Dining',    icon: 'grid' },
  { id: 'bedroom',  name: 'Bedroom',   icon: 'home' },
  { id: 'bathroom', name: 'Bathroom',  icon: 'droplet' },
  { id: 'laundry',  name: 'Laundry',   icon: 'refresh-cw' },
  { id: 'office',   name: 'Office',    icon: 'edit-2' },
  { id: 'closet',   name: 'Closets',   icon: 'layers' },
  { id: 'outdoor',  name: 'Outdoor',   icon: 'tree' },
  { id: 'garage',   name: 'Garage',    icon: 'grid' },
  { id: 'decor',    name: 'Decor',     icon: 'star' },
  { id: 'lighting', name: 'Lighting',  icon: 'sun' },
  { id: 'plants',   name: 'Plants',    icon: 'tree' },
  { id: 'wallart',  name: 'Wall Art',  icon: 'image' },
  { id: 'storage',  name: 'Storage',   icon: 'layers' },
];

export const MATERIALS = [
  'White Oak', 'Walnut', 'Ash Wood', 'Reclaimed Pine',
  'Matte Black Metal', 'Brushed Brass', 'Brushed Nickel',
  'Linen', 'Boucle', 'Leather', 'Velvet',
  'Carrara Marble', 'Ceramic', 'Rattan', 'Limewash Plaster',
];

export const COLORS = [
  { name: 'Warm White',   hex: '#F5F1E8' },
  { name: 'Cream',        hex: '#EFE6D3' },
  { name: 'Sand',         hex: '#D9C7A8' },
  { name: 'Terracotta',   hex: '#C1602E' },
  { name: 'Sage',         hex: '#7C9473' },
  { name: 'Olive',        hex: '#6B7350' },
  { name: 'Slate Blue',   hex: '#5C87A6' },
  { name: 'Navy',         hex: '#2E4258' },
  { name: 'Charcoal',     hex: '#3A3733' },
  { name: 'Black',        hex: '#1C1A17' },
  { name: 'Blush',        hex: '#E4B7AB' },
  { name: 'Rust',         hex: '#B15544' },
  { name: 'Butter',       hex: '#E8C468' },
  { name: 'Stone Grey',   hex: '#A8A297' },
];

let _pid = 0;
const piece = (name, category, icon, footprint = '1x1') => ({
  id: `p${++_pid}`, name, category, icon, footprint,
  price: 80 + ((_pid * 47) % 540),
  colors: COLORS.slice(0, 8).map(c => c.name),
  materials: MATERIALS.slice(0, 6),
});

export const PIECES = [
  // Living
  piece('Sofa', 'living', 'home', '2x1'),
  piece('Loveseat', 'living', 'home'),
  piece('Coffee Table', 'living', 'grid'),
  piece('Armchair', 'living', 'home'),
  piece('TV Console', 'living', 'grid'),
  piece('Bookshelf', 'living', 'layers'),
  piece('Rug', 'living', 'grid'),
  // Kitchen
  piece('Kitchen Island', 'kitchen', 'grid', '2x1'),
  piece('Cabinets', 'kitchen', 'grid'),
  piece('Refrigerator', 'kitchen', 'grid'),
  piece('Range', 'kitchen', 'grid'),
  piece('Sink', 'kitchen', 'droplet'),
  piece('Bar Stool', 'kitchen', 'home'),
  // Dining
  piece('Dining Table', 'dining', 'grid', '2x1'),
  piece('Dining Chair', 'dining', 'home'),
  piece('Sideboard', 'dining', 'layers'),
  piece('Pendant Light', 'dining', 'sun'),
  // Bedroom
  piece('Bed', 'bedroom', 'home', '2x2'),
  piece('Nightstand', 'bedroom', 'grid'),
  piece('Dresser', 'bedroom', 'layers'),
  piece('Vanity', 'bedroom', 'grid'),
  // Bathroom
  piece('Bathtub', 'bathroom', 'droplet', '2x1'),
  piece('Shower', 'bathroom', 'droplet'),
  piece('Vanity Sink', 'bathroom', 'droplet'),
  piece('Toilet', 'bathroom', 'droplet'),
  // Laundry
  piece('Washer', 'laundry', 'refresh-cw'),
  piece('Dryer', 'laundry', 'refresh-cw'),
  piece('Laundry Sink', 'laundry', 'droplet'),
  // Office
  piece('Desk', 'office', 'edit-2'),
  piece('Office Chair', 'office', 'home'),
  piece('Bookcase', 'office', 'layers'),
  // Closet
  piece('Wardrobe', 'closet', 'layers'),
  piece('Shoe Rack', 'closet', 'layers'),
  // Outdoor
  piece('Patio Sofa', 'outdoor', 'home'),
  piece('Fire Pit', 'outdoor', 'sun'),
  piece('Outdoor Dining Set', 'outdoor', 'grid', '2x1'),
  piece('Pool Lounger', 'outdoor', 'home'),
  piece('Garden Bed', 'outdoor', 'tree'),
  // Garage
  piece('Workbench', 'garage', 'grid'),
  piece('Storage Rack', 'garage', 'layers'),
  // Decor
  piece('Vase', 'decor', 'star'),
  piece('Throw Pillow', 'decor', 'star'),
  piece('Mirror', 'decor', 'image'),
  piece('Candle', 'decor', 'star'),
  // Lighting
  piece('Floor Lamp', 'lighting', 'sun'),
  piece('Table Lamp', 'lighting', 'sun'),
  piece('Chandelier', 'lighting', 'sun'),
  // Plants
  piece('Potted Tree', 'plants', 'tree'),
  piece('Succulent', 'plants', 'tree'),
  piece('Hanging Plant', 'plants', 'tree'),
  // Wall Art
  piece('Framed Print', 'wallart', 'image'),
  piece('Gallery Wall', 'wallart', 'image'),
  // Storage
  piece('Storage Basket', 'storage', 'layers'),
  piece('Built-in Shelving', 'storage', 'layers'),
];

export const ROOM_TYPES = [
  { id: 'living',   name: 'Living Room', icon: 'home',     gridW: 8, gridH: 6, categories: ['living', 'decor', 'lighting', 'plants', 'wallart', 'storage'] },
  { id: 'kitchen',  name: 'Kitchen',     icon: 'grid',     gridW: 7, gridH: 6, categories: ['kitchen', 'storage', 'lighting', 'decor'] },
  { id: 'dining',   name: 'Dining Room', icon: 'grid',     gridW: 7, gridH: 5, categories: ['dining', 'lighting', 'decor', 'wallart'] },
  { id: 'bedroom',  name: 'Bedroom',     icon: 'home',     gridW: 7, gridH: 6, categories: ['bedroom', 'closet', 'lighting', 'decor', 'wallart', 'plants'] },
  { id: 'bathroom', name: 'Bathroom',    icon: 'droplet',  gridW: 5, gridH: 5, categories: ['bathroom', 'storage', 'lighting', 'decor'] },
  { id: 'laundry',  name: 'Laundry',     icon: 'refresh-cw', gridW: 4, gridH: 4, categories: ['laundry', 'storage'] },
  { id: 'office',   name: 'Office',      icon: 'edit-2',   gridW: 6, gridH: 5, categories: ['office', 'storage', 'lighting', 'decor', 'wallart', 'plants'] },
  { id: 'closet',   name: 'Closet',      icon: 'layers',   gridW: 4, gridH: 4, categories: ['closet', 'storage'] },
  { id: 'garage',   name: 'Garage',      icon: 'grid',     gridW: 8, gridH: 6, categories: ['garage', 'storage'] },
  { id: 'custom',   name: 'My Home',     icon: 'home',     gridW: 8, gridH: 6, categories: ['living', 'kitchen', 'dining', 'bedroom', 'bathroom', 'laundry', 'office', 'closet', 'outdoor', 'garage', 'decor', 'lighting', 'plants', 'wallart', 'storage'] },
];

export const EXTERIOR_OPTIONS = {
  roofStyles: ['Gable', 'Hip', 'Flat', 'Butterfly', 'Dutch Gable', 'Shed'],
  roofColors: COLORS.slice(2, 10),
  siding: ['White Lap Siding', 'Board & Batten', 'Stucco', 'Natural Stone', 'Red Brick', 'Cedar Shingle', 'Limewash Plaster'],
  driveway: ['Poured Concrete', 'Pavers', 'Gravel', 'Cobblestone', 'Asphalt'],
  fence: ['White Picket', 'Horizontal Slat', 'Wrought Iron', 'Stone Wall', 'Hedge', 'None'],
  garden: ['Manicured Lawn', 'Wildflower Meadow', 'Desert Xeriscape', 'Vegetable Garden', 'Rose Garden'],
  extras: ['Pool', 'Outdoor Kitchen', 'Fire Pit', 'Patio', 'Pergola', 'Walkway Lighting'],
};

export const WORLD_THEMES = [
  { id: 'coastal',    name: 'Coastal Neighborhood', icon: 'droplet', keywords: ['coastal', 'beach', 'ocean', 'california', 'cliff', 'palm'], features: ['Ocean Cliffs', 'Palm-Lined Streets', 'Boutique Shopping', 'Beach Access'], palette: '#5C87A6' },
  { id: 'mountain',   name: 'Mountain Town',        icon: 'tree', keywords: ['mountain', 'pine', 'lodge', 'ski'], features: ['Pine Forests', 'Alpine Lake', 'Ski Lodge', 'Mountain Trails'], palette: '#6B4F3A' },
  { id: 'european',   name: 'European Village',     icon: 'map', keywords: ['european', 'village', 'stone', 'cobblestone', 'plaza'], features: ['Stone Streets', 'Town Square', 'Flower Cottages', 'Café Plaza'], palette: '#C1602E' },
  { id: 'farmhouse',  name: 'Countryside',          icon: 'sun', keywords: ['farmhouse', 'vineyard', 'ranch', 'horse', 'rolling hills', 'countryside'], features: ['Vineyards', 'Horse Pastures', 'Rolling Hills', 'Farm Stands'], palette: '#7C9473' },
  { id: 'city',       name: 'Modern City',          icon: 'grid', keywords: ['city', 'urban', 'downtown', 'skyline'], features: ['High-Rises', 'Transit Lines', 'Rooftop Parks', 'Waterfront Promenade'], palette: '#3A3733' },
  { id: 'desert',     name: 'Desert Oasis',         icon: 'sun', keywords: ['desert', 'oasis', 'canyon', 'adobe'], features: ['Canyon Views', 'Adobe Architecture', 'Cactus Gardens', 'Palm Oasis'], palette: '#C79A3A' },
  { id: 'forest',     name: 'Forest Retreat',       icon: 'tree', keywords: ['forest', 'lake', 'lakeside', 'woods', 'cabin'], features: ['Lakefront Docks', 'Forest Trails', 'Cabins', 'Sunset Point'], palette: '#5C87A6' },
];

export const ENVIRONMENT_TILES = ['coastal', 'mountain', 'farmhouse', 'city', 'desert', 'forest']
  .map(id => WORLD_THEMES.find(t => t.id === id));

export const TIME_OF_DAY = ['Sunrise', 'Golden Hour', 'Midday', 'Sunset', 'Night'];
export const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
export const WEATHER = ['Clear', 'Cloudy', 'Rainy', 'Snowy'];

export function matchTheme(prompt) {
  const p = (prompt || '').toLowerCase();
  let best = null, bestScore = 0;
  for (const t of WORLD_THEMES) {
    const score = t.keywords.reduce((s, k) => s + (p.includes(k) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = t; }
  }
  return best || WORLD_THEMES[0];
}
