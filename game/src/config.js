// Nasi Uduk Ekspress: tuning, layout, menu and drinks. One place for every
// number the world and the renderer agree on, so a tweak here moves the whole
// warung. The rice is always served wrapped in brown paper (kertas coklat) —
// that packet is the signature visual of every plate.
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const SHIFT_SECONDS = 180;
export const BEST_KEY = 'nasi-uduk-ekspress-best';

/** The cook's movement and size. */
export const COOK = { speed: 270, radius: 18, interactReach: 78 };

/** The kitchen floor the cook walks on (inside the walls). */
export const FLOOR = { x: 8, y: 92, width: 1264, height: 620 };

/** Every station: its counter rectangle and the floor-side edge the cook stands at. */
export const STATIONS = {
  // Raw-ingredient baskets down the left wall (top to bottom). The column
  // ends well above the bottom row so the walk-to corridor stays open.
  crateBeras: { kind: 'crate', item: 'beras', label: 'BERAS', x: 16, y: 100, width: 152, height: 50 },
  crateBihun: { kind: 'crate', item: 'bihun', label: 'BIHUN', x: 16, y: 154, width: 152, height: 50 },
  crateMie: { kind: 'crate', item: 'mie', label: 'MIE', x: 16, y: 208, width: 152, height: 50 },
  crateTelur: { kind: 'crate', item: 'telur', label: 'TELUR', x: 16, y: 262, width: 152, height: 50 },
  crateTempe: { kind: 'crate', item: 'tempe', label: 'TEMPE', x: 16, y: 316, width: 152, height: 50 },
  crateTahu: { kind: 'crate', item: 'tahu', label: 'TAHU', x: 16, y: 370, width: 152, height: 50 },
  crateJengkol: { kind: 'crate', item: 'jengkol', label: 'JENGKOL', x: 16, y: 424, width: 152, height: 50 },
  crateCabe: { kind: 'crate', item: 'cabe', label: 'CABE', x: 16, y: 478, width: 152, height: 50 },
  // Timed cookers along the top wall.
  rice: { kind: 'cooker', cooker: 'rice', label: 'PENANAK NASI', x: 300, y: 120, width: 240, height: 96, slots: 2 },
  wajan: { kind: 'cooker', cooker: 'wajan', label: 'WAJAN', x: 570, y: 120, width: 170, height: 96, slots: 2 },
  fryer: { kind: 'cooker', cooker: 'fryer', label: 'PENGGORENGAN', x: 770, y: 120, width: 170, height: 96, slots: 2 },
  serve: { kind: 'serve', label: 'SAJI', x: 970, y: 120, width: 180, height: 96 },
  // Turmeric rice lives in the top-right corner basket: the cook can never
  // stand above the top row, so its approach from below is always open.
  crateKuning: { kind: 'crate', item: 'berasKuning', label: 'KUNING', x: 1170, y: 120, width: 100, height: 96 },
  // Bottom wall: pound, fry eggs, pour drinks, plate up, garnish, toss.
  // The row starts clear of the left-wall baskets so every approach point
  // is reachable from the open floor above it.
  cobek: { kind: 'prep', label: 'COBEK', x: 186, y: 560, width: 150, height: 100 },
  eggpan: { kind: 'cooker', cooker: 'eggpan', label: 'WAJAN TELUR', x: 356, y: 560, width: 150, height: 100, slots: 2 },
  drinks: { kind: 'drinks', label: 'MINUMAN', x: 526, y: 560, width: 200, height: 100 },
  assembly: { kind: 'assembly', label: 'SAJI PIRING', x: 746, y: 560, width: 230, height: 100 },
  crateBawang: { kind: 'crate', item: 'bawangGoreng', label: 'BAWANG', x: 996, y: 560, width: 80, height: 100 },
  crateKerupuk: { kind: 'crate', item: 'kerupuk', label: 'KERUPUK', x: 1096, y: 560, width: 80, height: 100 },
  trash: { kind: 'trash', label: 'BUANG', x: 1196, y: 560, width: 76, height: 100 },
};

/**
 * The timed cookers: what raw item goes in, what cooked item comes out,
 * seconds to cook, then seconds before it burns.
 */
export const COOKERS = {
  rice: { raws: { beras: 'nasi', berasKuning: 'nasiKuning' }, cook: 7, burn: 8 },
  wajan: { raws: { bihun: 'bihunGoreng', mie: 'mieKeriting', tempe: 'orekTempe', nasi: 'nasiGoreng' }, cook: 6, burn: 7 },
  fryer: { raws: { tahu: 'tahuCabe', jengkol: 'jengkolGoreng' }, cook: 6, burn: 7 },
  eggpan: { raws: { telur: 'telorBalado' }, cook: 5, burn: 6 },
};
/** Pounds on the cobek to turn cabe into sambal. */
export const POUNDS_NEEDED = 3;

/** The drinks menu: every drink pours at the MINUMAN station. */
export const DRINKS = [
  { id: 'tehManis', name: 'Teh Manis Panas', brew: 2 },
  { id: 'kopiHitam', name: 'Kopi Hitam', brew: 2 },
  { id: 'esTeh', name: 'Es Teh Manis', brew: 2.5 },
  { id: 'tehTawar', name: 'Teh Tawar', brew: 1.5 },
  { id: 'airPutih', name: 'Air Putih', brew: 0.5 },
];

/** Item catalogue: what the hand can hold, how it draws, what it is. */
export const ITEMS = {
  beras: { name: 'Beras', color: '#f5efdd', dark: '#d8cba6' },
  nasi: { name: 'Nasi uduk', color: '#a9713f', dark: '#7d4f28' },
  berasKuning: { name: 'Beras kuning', color: '#f7d54d', dark: '#d9a91f' },
  nasiKuning: { name: 'Nasi kuning', color: '#f7c948', dark: '#d9a91f' },
  nasiGoreng: { name: 'Nasi goreng', color: '#c98a4b', dark: '#8f5f2a' },
  bihun: { name: 'Bihun', color: '#f2e8c9', dark: '#cbb98a' },
  bihunGoreng: { name: 'Bihun goreng', color: '#d99a3d', dark: '#a86f1e' },
  mie: { name: 'Mie', color: '#f7e3a1', dark: '#d9b968' },
  mieKeriting: { name: 'Mie keriting', color: '#e8a33c', dark: '#b57a1e' },
  telur: { name: 'Telur', color: '#f7ead0', dark: '#d8c49a' },
  telorBalado: { name: 'Telor balado', color: '#e0524d', dark: '#b03030' },
  tempe: { name: 'Tempe', color: '#e3cfa3', dark: '#b89b62' },
  orekTempe: { name: 'Orek tempe', color: '#8a5a28', dark: '#5f3c16' },
  tahu: { name: 'Tahu', color: '#f7f3e8', dark: '#d8d2c0' },
  tahuCabe: { name: 'Tahu cabe', color: '#d94f3d', dark: '#a82c20' },
  jengkol: { name: 'Jengkol', color: '#7a5a34', dark: '#543d20' },
  jengkolGoreng: { name: 'Jengkol goreng', color: '#5a3d1e', dark: '#3a2812' },
  cabe: { name: 'Cabe', color: '#d63a2f', dark: '#9e241d' },
  sambal: { name: 'Sambal', color: '#c22e22', dark: '#8f1d15' },
  bawangGoreng: { name: 'Bawang goreng', color: '#c98a2e', dark: '#8f5f14' },
  kerupuk: { name: 'Kerupuk', color: '#f2a0b5', dark: '#d17a92' },
  tehManis: { name: 'Teh Manis Panas', color: '#d98a2e', dark: '#a8621a' },
  kopiHitam: { name: 'Kopi Hitam', color: '#2e1d12', dark: '#120a06' },
  esTeh: { name: 'Es Teh Manis', color: '#e0a53c', dark: '#b57e22' },
  tehTawar: { name: 'Teh Tawar', color: '#e8d9a0', dark: '#c4b078' },
  airPutih: { name: 'Air Putih', color: '#bfe3f2', dark: '#7fb8d4' },
  burnt: { name: 'Gosong!', color: '#2b2b2b', dark: '#111111' },
};

/**
 * The three rice bases. Every order picks one base + one lauk combo below.
 * Uduk steams in the rice cooker and is wrapped in brown paper; kuning
 * steams in the rice cooker from turmeric rice and is served as a golden
 * mound; goreng is steamed rice fried in the wajan with egg and veg.
 */
export const RICE_BASES = {
  nasi: { name: 'Uduk', full: 'Nasi Uduk', price: 5 },
  nasiKuning: { name: 'Kuning', full: 'Nasi Kuning', price: 6 },
  nasiGoreng: { name: 'Goreng', full: 'Nasi Goreng', price: 7 },
};

/** Lauk combos: 2–3 lauk from the six, plus bawang goreng / kerupuk as toppings only. */
export const COMBOS = {
  bihun: { name: 'Bihun', items: ['bihunGoreng', 'orekTempe', 'bawangGoreng'], price: 5 },
  mie: { name: 'Mie', items: ['mieKeriting', 'tahuCabe', 'kerupuk'], price: 6 },
  telor: { name: 'Telor', items: ['telorBalado', 'bihunGoreng', 'bawangGoreng'], price: 5 },
  tempe: { name: 'Tempe', items: ['orekTempe', 'tahuCabe', 'sambal'], price: 4 },
  jengkol: { name: 'Jengkol', items: ['jengkolGoreng', 'mieKeriting', 'kerupuk'], price: 7 },
  tahu: { name: 'Tahu', items: ['tahuCabe', 'telorBalado', 'bawangGoreng'], price: 6 },
  komplit: { name: 'Komplit', items: ['orekTempe', 'telorBalado', 'mieKeriting', 'sambal', 'kerupuk'], price: 11 },
  campur: { name: 'Campur', items: ['bihunGoreng', 'jengkolGoreng', 'tahuCabe'], price: 8 },
};

/** Order pressure: how the shift escalates. */
export const ORDERS = {
  firstAt: 2,
  intervalStart: 16,
  intervalEnd: 9,
  maxConcurrent: 4,
  patienceStart: 58,
  patienceEnd: 40,
  comboWindow: 20,
  comboStep: 0.25,
  latePenalty: 3,
  drinkChanceStart: 0.3,
  drinkChanceEnd: 0.6,
  drinkPrice: 2,
};

/** Palette for the whole warung. */
export const COLORS = {
  wall: '#4a2f22',
  wallTile: '#5d3d2c',
  batik: '#e9b949',
  floorA: '#e8c9a0',
  floorB: '#ddb98a',
  counterTop: '#a9713f',
  counterSide: '#7d4f28',
  steel: '#8f9aa5',
  steelDark: '#5d6b78',
  hud: '#2b1d18',
  hudPanel: '#3a2a24',
  cream: '#fff7e8',
  ink: '#2b1d18',
  gold: '#f7c948',
  red: '#e0524d',
  green: '#5faf52',
  leaf: '#4f9e44',
  leafDark: '#3a7d33',
};
