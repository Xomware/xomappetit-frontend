// ---------- Units ----------

export type Unit =
  | 'count' | 'g' | 'kg' | 'oz' | 'lb' | 'ml' | 'l'
  | 'cup' | 'tbsp' | 'tsp' | 'clove' | 'pinch' | 'dash'
  | 'slice' | 'can' | 'to-taste';

export const UNITS: Unit[] = [
  'count', 'g', 'kg', 'oz', 'lb', 'ml', 'l',
  'cup', 'tbsp', 'tsp', 'clove', 'pinch', 'dash',
  'slice', 'can', 'to-taste',
];

export const UNIT_LABELS: Record<Unit, string> = {
  count: 'count',
  g: 'g',
  kg: 'kg',
  oz: 'oz',
  lb: 'lb',
  ml: 'ml',
  l: 'L',
  cup: 'cup',
  tbsp: 'tbsp',
  tsp: 'tsp',
  clove: 'clove',
  pinch: 'pinch',
  dash: 'dash',
  slice: 'slice',
  can: 'can',
  'to-taste': 'to taste',
};

export const UNITLESS_UNITS = new Set<Unit>(['to-taste', 'pinch', 'dash']);

// Sensible default amount when the user picks a unit. Used to prefill the
// amount input so 'tsp' becomes '1 tsp' instead of leaving an empty box.
export const UNIT_DEFAULT_AMOUNTS: Partial<Record<Unit, number>> = {
  count: 1,
  g: 100,
  kg: 1,
  oz: 4,
  lb: 1,
  ml: 250,
  l: 1,
  cup: 1,
  tbsp: 1,
  tsp: 1,
  clove: 1,
  slice: 1,
  can: 1,
};

// ---------- Protein types ----------

export type ProteinType =
  | 'chicken' | 'beef' | 'pork' | 'turkey' | 'lamb'
  | 'fish' | 'salmon' | 'tuna' | 'shrimp' | 'shellfish'
  | 'tofu' | 'tempeh' | 'seitan'
  | 'beans' | 'lentils' | 'chickpeas'
  | 'eggs' | 'dairy' | 'nuts'
  | 'none' | 'other';

export const PROTEIN_TYPES: ProteinType[] = [
  'chicken', 'beef', 'pork', 'turkey', 'lamb',
  'fish', 'salmon', 'tuna', 'shrimp', 'shellfish',
  'tofu', 'tempeh', 'seitan',
  'beans', 'lentils', 'chickpeas',
  'eggs', 'dairy', 'nuts',
  'none', 'other',
];

export const PROTEIN_LABELS: Record<ProteinType, string> = {
  chicken: 'Chicken',
  beef: 'Beef',
  pork: 'Pork',
  turkey: 'Turkey',
  lamb: 'Lamb',
  fish: 'Fish',
  salmon: 'Salmon',
  tuna: 'Tuna',
  shrimp: 'Shrimp',
  shellfish: 'Shellfish',
  tofu: 'Tofu',
  tempeh: 'Tempeh',
  seitan: 'Seitan',
  beans: 'Beans',
  lentils: 'Lentils',
  chickpeas: 'Chickpeas',
  eggs: 'Eggs',
  dairy: 'Dairy',
  nuts: 'Nuts',
  none: 'None',
  other: 'Other',
};

// ---------- Tags ----------

export type Tag =
  | 'vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free' | 'nut-free'
  | 'low-carb' | 'keto' | 'paleo' | 'high-protein' | 'low-calorie'
  | 'spicy' | 'sweet' | 'savory'
  | 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'appetizer'
  | 'side' | 'main' | 'soup' | 'salad'
  | 'baking' | 'grilling' | 'slow-cooker' | 'instant-pot' | 'one-pan' | 'no-cook'
  | 'meal-prep' | 'quick' | 'date-night' | 'comfort' | 'kid-friendly';

export const TAGS: Tag[] = [
  'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free',
  'low-carb', 'keto', 'paleo', 'high-protein', 'low-calorie',
  'spicy', 'sweet', 'savory',
  'breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer',
  'side', 'main', 'soup', 'salad',
  'baking', 'grilling', 'slow-cooker', 'instant-pot', 'one-pan', 'no-cook',
  'meal-prep', 'quick', 'date-night', 'comfort', 'kid-friendly',
];

export const TAG_LABELS: Record<Tag, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  'gluten-free': 'Gluten-free',
  'dairy-free': 'Dairy-free',
  'nut-free': 'Nut-free',
  'low-carb': 'Low-carb',
  keto: 'Keto',
  paleo: 'Paleo',
  'high-protein': 'High-protein',
  'low-calorie': 'Low-calorie',
  spicy: 'Spicy',
  sweet: 'Sweet',
  savory: 'Savory',
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  dessert: 'Dessert',
  appetizer: 'Appetizer',
  side: 'Side',
  main: 'Main',
  soup: 'Soup',
  salad: 'Salad',
  baking: 'Baking',
  grilling: 'Grilling',
  'slow-cooker': 'Slow cooker',
  'instant-pot': 'Instant pot',
  'one-pan': 'One pan',
  'no-cook': 'No cook',
  'meal-prep': 'Meal prep',
  quick: 'Quick',
  'date-night': 'Date night',
  comfort: 'Comfort',
  'kid-friendly': 'Kid-friendly',
};

export const TAG_GROUPS: { label: string; tags: Tag[] }[] = [
  { label: 'Diet', tags: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'low-carb', 'keto', 'paleo', 'high-protein', 'low-calorie'] },
  { label: 'Flavor', tags: ['spicy', 'sweet', 'savory'] },
  { label: 'Meal', tags: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer', 'side', 'main', 'soup', 'salad'] },
  { label: 'Method', tags: ['baking', 'grilling', 'slow-cooker', 'instant-pot', 'one-pan', 'no-cook'] },
  { label: 'Vibe', tags: ['meal-prep', 'quick', 'date-night', 'comfort', 'kid-friendly'] },
];

// ---------- Core shapes ----------

export interface Ingredient {
  name: string;
  amount: number | null;
  unit: Unit | null;
}

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type MacrosScope = 'per-serving' | 'per-recipe';

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type Privacy = 'public' | 'friends' | 'private';

export interface Instruction {
  text: string;
  ingredientIndexes: number[];
}

export interface Recipe {
  recipeId: string;
  authorUserId: string;
  /** Denormalized handle (lowercase) of the author at create time. */
  authorHandle: string | null;
  name: string;
  description: string;
  timeMinutes: number;
  difficulty: Difficulty;
  servings: number;
  /** Legacy free-text protein label — kept for back-compat / search. */
  proteinSource: string;
  proteinTypes: ProteinType[];
  tags: Tag[];
  ingredients: (string | Ingredient)[];
  instructions: (string | Instruction)[];
  macros: Macros;
  macrosScope: MacrosScope;
  privacy: Privacy;
  cookCount: number;
  likeCount?: number;
  likedByMe?: boolean;
  avgRating: number | null;
  ratingCount: number;
  spicinessAvg: number | null;
  spicinessCount: number;
  sweetnessAvg: number | null;
  sweetnessCount: number;
  saltinessAvg: number | null;
  saltinessCount: number;
  richnessAvg: number | null;
  richnessCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Cook {
  cookId: string;
  recipeId: string;
  cookedAt: string;
  chefs: string[];
  diners: string[];
  notes: string;
  photoUrl: string | null;
  rating: number | null;
  spiciness: number | null;
  sweetness: number | null;
  saltiness: number | null;
  richness: number | null;
  loggedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeComment {
  recipeId: string;
  commentId: string;
  userId: string;
  text: string;
  createdAt: string;
}

// ---------- Helpers ----------

export const ingredientName = (i: string | Ingredient): string =>
  typeof i === 'string' ? i : i.name;

export const ingredientLabel = (i: string | Ingredient): string => {
  if (typeof i === 'string') return i;
  const parts: string[] = [];
  if (i.amount != null) parts.push(formatAmount(i.amount));
  if (i.unit) parts.push(UNIT_LABELS[i.unit] ?? i.unit);
  parts.push(i.name);
  return parts.filter(Boolean).join(' ');
};

export const normalizeIngredient = (i: string | Ingredient): Ingredient => {
  if (typeof i === 'string') return { name: i, amount: null, unit: null };
  // Tolerate legacy `quantity` field on read.
  const legacy = i as Ingredient & { quantity?: number | null };
  const amount = i.amount ?? legacy.quantity ?? null;
  return { name: i.name, amount, unit: i.unit };
};

export const instructionText = (s: string | Instruction): string =>
  typeof s === 'string' ? s : s.text;

export const normalizeInstruction = (s: string | Instruction): Instruction => {
  if (typeof s === 'string') return { text: s, ingredientIndexes: [] };
  return { text: s.text, ingredientIndexes: s.ingredientIndexes ?? [] };
};

function formatAmount(n: number): string {
  // Preserve quarter-fractions for the common cases (1/4, 1/2, 3/4) so
  // recipes feel handwritten instead of "0.5 tbsp salt".
  const whole = Math.floor(n);
  const frac = n - whole;
  const map: Record<string, string> = {
    '0.25': '¼',
    '0.5': '½',
    '0.75': '¾',
    '0.33': '⅓',
    '0.67': '⅔',
  };
  const fracKey = frac.toFixed(2);
  const sym = map[fracKey] ?? null;
  if (sym && whole === 0) return sym;
  if (sym) return `${whole}${sym}`;
  return Number.isInteger(n) ? String(n) : String(n);
}
