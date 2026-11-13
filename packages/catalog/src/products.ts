export type Category = 'coffee' | 'tea' | 'brewing' | 'mugs';

export interface Product {
  sku: string;
  name: string;
  category: Category;
  /** List price in US cents; regional prices are derived from it. */
  priceUsd: number;
  weightGrams: number;
  stock: number;
  description: string;
}

export const PRODUCTS: readonly Product[] = [
  {
    sku: 'NW-COF-001',
    name: 'Morning Ridge Blend, 340 g',
    category: 'coffee',
    priceUsd: 1499,
    weightGrams: 360,
    stock: 240,
    description: 'Medium roast, notes of cocoa and toasted almond.',
  },
  {
    sku: 'NW-COF-002',
    name: 'Highland Single Origin, 340 g',
    category: 'coffee',
    priceUsd: 1899,
    weightGrams: 360,
    stock: 120,
    description: 'Washed process, bright citrus and honey.',
  },
  {
    sku: 'NW-COF-003',
    name: 'Swiss Water Decaf, 340 g',
    category: 'coffee',
    priceUsd: 1599,
    weightGrams: 360,
    stock: 90,
    description: 'Chemical-free decaf with a round, chocolatey body.',
  },
  {
    sku: 'NW-COF-004',
    name: 'Espresso Roast, 1 kg',
    category: 'coffee',
    priceUsd: 3899,
    weightGrams: 1040,
    stock: 60,
    description: 'Dark roast for milk drinks; caramel and molasses.',
  },
  {
    sku: 'NW-TEA-001',
    name: 'Earl Grey Loose Leaf, 100 g',
    category: 'tea',
    priceUsd: 1099,
    weightGrams: 120,
    stock: 150,
    description: 'Black tea with bergamot oil and cornflower petals.',
  },
  {
    sku: 'NW-TEA-002',
    name: 'Sencha Green, 100 g',
    category: 'tea',
    priceUsd: 1299,
    weightGrams: 120,
    stock: 110,
    description: 'Steamed Japanese green tea, grassy and sweet.',
  },
  {
    sku: 'NW-TEA-003',
    name: 'Rooibos Vanilla, 100 g',
    category: 'tea',
    priceUsd: 999,
    weightGrams: 120,
    stock: 0,
    description: 'Caffeine-free red bush tea with vanilla bean.',
  },
  {
    sku: 'NW-BRW-001',
    name: 'Pour-Over Dripper',
    category: 'brewing',
    priceUsd: 2499,
    weightGrams: 420,
    stock: 75,
    description: 'Ceramic cone with spiral ribs for an even extraction.',
  },
  {
    sku: 'NW-BRW-002',
    name: 'Conical Burr Grinder',
    category: 'brewing',
    priceUsd: 8999,
    weightGrams: 2300,
    stock: 25,
    description: 'Forty grind settings from espresso to cold brew.',
  },
  {
    sku: 'NW-BRW-003',
    name: 'French Press, 1 L',
    category: 'brewing',
    priceUsd: 3499,
    weightGrams: 900,
    stock: 40,
    description: 'Borosilicate glass with a double steel mesh filter.',
  },
  {
    sku: 'NW-BRW-004',
    name: 'Gooseneck Kettle',
    category: 'brewing',
    priceUsd: 5999,
    weightGrams: 1100,
    stock: 30,
    description: 'Variable temperature, holds heat for an hour.',
  },
  {
    sku: 'NW-BRW-005',
    name: 'Paper Filters, 100 pack',
    category: 'brewing',
    priceUsd: 699,
    weightGrams: 150,
    stock: 500,
    description: 'Unbleached filters sized for the pour-over dripper.',
  },
  {
    sku: 'NW-MUG-001',
    name: 'Stoneware Mug, 350 ml',
    category: 'mugs',
    priceUsd: 1599,
    weightGrams: 410,
    stock: 200,
    description: 'Hand-glazed, dishwasher safe.',
  },
  {
    sku: 'NW-MUG-002',
    name: 'Double-Wall Glasses, set of 2',
    category: 'mugs',
    priceUsd: 2299,
    weightGrams: 380,
    stock: 85,
    description: 'Keeps drinks hot and hands cool.',
  },
  {
    sku: 'NW-MUG-003',
    name: 'Travel Tumbler, 450 ml',
    category: 'mugs',
    priceUsd: 2799,
    weightGrams: 330,
    stock: 70,
    description: 'Leak-proof lid, vacuum insulated steel.',
  },
  {
    sku: 'NW-MUG-004',
    name: 'Espresso Cups, set of 4',
    category: 'mugs',
    priceUsd: 1999,
    weightGrams: 520,
    stock: 45,
    description: 'Thick-walled porcelain demitasse cups.',
  },
];
