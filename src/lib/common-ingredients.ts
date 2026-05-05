/**
 * Curated staple-pantry list for the IngredientsEditor autocomplete.
 * Kept short and English-only — Phase B (recipe import) will expand
 * the vocabulary as users paste recipes from real sources.
 *
 * Pair with a localStorage-backed memory of the user's own past
 * ingredients (see useIngredientHistory) so the suggestion list grows
 * with usage.
 */
export const COMMON_INGREDIENTS: readonly string[] = [
  // Aromatics
  'onion', 'red onion', 'shallot', 'garlic', 'ginger', 'scallion', 'leek',
  // Herbs
  'basil', 'cilantro', 'parsley', 'mint', 'rosemary', 'thyme', 'oregano', 'sage', 'dill', 'chives', 'bay leaf',
  // Spices & dry
  'salt', 'pepper', 'black pepper', 'red pepper flakes', 'paprika', 'smoked paprika', 'cumin', 'coriander', 'turmeric', 'cinnamon', 'nutmeg', 'cardamom', 'clove', 'allspice', 'chili powder', 'curry powder', 'garam masala', 'fennel seed', 'mustard seed', 'sesame seed', 'star anise', 'vanilla extract',
  // Oils & fats
  'olive oil', 'extra virgin olive oil', 'vegetable oil', 'canola oil', 'sesame oil', 'avocado oil', 'butter', 'unsalted butter', 'ghee', 'lard', 'coconut oil',
  // Vinegars & condiments
  'soy sauce', 'tamari', 'fish sauce', 'oyster sauce', 'hoisin sauce', 'miso', 'rice vinegar', 'apple cider vinegar', 'red wine vinegar', 'balsamic vinegar', 'white wine vinegar', 'sriracha', 'gochujang', 'tahini', 'dijon mustard', 'mayonnaise', 'ketchup', 'worcestershire sauce', 'hot sauce', 'lemon juice', 'lime juice',
  // Dairy & alt
  'milk', 'whole milk', 'heavy cream', 'half and half', 'sour cream', 'yogurt', 'greek yogurt', 'cream cheese', 'cottage cheese', 'parmesan', 'mozzarella', 'cheddar', 'feta', 'goat cheese', 'ricotta', 'oat milk', 'almond milk', 'coconut milk',
  // Eggs
  'egg', 'egg yolk', 'egg white',
  // Proteins
  'chicken breast', 'chicken thigh', 'whole chicken', 'ground chicken', 'ground beef', 'ground turkey', 'ground pork', 'beef', 'steak', 'sirloin', 'ribeye', 'skirt steak', 'flank steak', 'pork chop', 'pork tenderloin', 'bacon', 'pancetta', 'sausage', 'ham', 'salmon', 'cod', 'tuna', 'shrimp', 'scallop', 'tilapia', 'halibut', 'mahi mahi', 'tofu', 'firm tofu', 'silken tofu', 'tempeh', 'seitan', 'chickpeas', 'lentils', 'black beans', 'kidney beans', 'pinto beans', 'cannellini beans', 'edamame',
  // Vegetables
  'tomato', 'cherry tomato', 'roma tomato', 'cucumber', 'bell pepper', 'red bell pepper', 'green bell pepper', 'yellow bell pepper', 'jalapeno', 'serrano', 'poblano', 'carrot', 'celery', 'potato', 'sweet potato', 'mushroom', 'cremini mushroom', 'shiitake mushroom', 'spinach', 'kale', 'arugula', 'romaine', 'iceberg lettuce', 'cabbage', 'napa cabbage', 'broccoli', 'cauliflower', 'zucchini', 'yellow squash', 'eggplant', 'green bean', 'asparagus', 'corn', 'pea', 'snap pea', 'snow pea', 'beet', 'radish', 'fennel', 'butternut squash', 'acorn squash', 'pumpkin',
  // Fruits
  'apple', 'banana', 'lemon', 'lime', 'orange', 'grapefruit', 'avocado', 'strawberry', 'blueberry', 'raspberry', 'blackberry', 'pineapple', 'mango', 'pear', 'peach', 'plum', 'grape', 'pomegranate', 'watermelon', 'cherry',
  // Pantry / starches
  'rice', 'white rice', 'brown rice', 'jasmine rice', 'basmati rice', 'arborio rice', 'sushi rice', 'quinoa', 'couscous', 'farro', 'barley', 'orzo', 'pasta', 'spaghetti', 'penne', 'fettuccine', 'rigatoni', 'macaroni', 'lasagna noodle', 'ramen noodle', 'rice noodle', 'soba', 'udon', 'tortilla', 'flour tortilla', 'corn tortilla', 'pita', 'naan', 'bread', 'sourdough', 'baguette', 'breadcrumb', 'panko',
  // Baking
  'flour', 'all-purpose flour', 'bread flour', 'whole wheat flour', 'almond flour', 'sugar', 'brown sugar', 'powdered sugar', 'honey', 'maple syrup', 'molasses', 'baking powder', 'baking soda', 'yeast', 'cocoa powder', 'chocolate chip', 'dark chocolate',
  // Nuts & seeds
  'almond', 'cashew', 'pecan', 'walnut', 'pistachio', 'peanut', 'pine nut', 'sunflower seed', 'pumpkin seed', 'chia seed', 'flax seed', 'sesame', 'peanut butter', 'almond butter',
  // Stocks
  'chicken stock', 'beef stock', 'vegetable stock', 'water',
  // Wine
  'white wine', 'red wine', 'sake', 'mirin', 'sherry',
];

/**
 * localStorage-backed history of the user's own ingredient names.
 * Keeps the autocomplete personal: once you type 'gochujang' once,
 * it shows up in suggestions on every later recipe.
 */
const HISTORY_KEY = 'xomappetit:ingredient-history:v1';
const HISTORY_LIMIT = 200;

export function loadIngredientHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export function rememberIngredient(name: string): void {
  if (typeof window === 'undefined') return;
  const cleaned = name.trim().toLowerCase();
  if (!cleaned || cleaned.length > 60) return;
  const current = loadIngredientHistory();
  const next = [cleaned, ...current.filter((s) => s !== cleaned)].slice(0, HISTORY_LIMIT);
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // storage full or disabled — fine, we just lose local memory.
  }
}

/** Combined suggestion list (user history first, then curated staples). */
export function ingredientSuggestions(): string[] {
  const history = loadIngredientHistory();
  const seen = new Set(history);
  const merged = [...history];
  for (const s of COMMON_INGREDIENTS) {
    if (!seen.has(s)) {
      merged.push(s);
      seen.add(s);
    }
  }
  return merged;
}
