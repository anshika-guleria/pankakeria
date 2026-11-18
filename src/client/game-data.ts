export const TOPPING_ORDER = [
  'blueberry',
  'strawberry',
  'syrup',
  'cream',
  'butter',
] as const;

export type Topping = (typeof TOPPING_ORDER)[number];

export type ToppingInfo = {
  label: string;
  icon: string;
  toolAsset: string;
  action: string;
};

export type ToppingCounts = Record<Topping, number>;

export type Order = {
  id: string;
  customer: string;
  avatar: string;
  greeting: string;
  toppings: Partial<Record<Topping, number>>;
};

export const TOPPINGS: Record<Topping, ToppingInfo> = {
  blueberry: {
    label: 'Blueberries',
    icon: '🫐',
    toolAsset: '/assets/tools/blueberry-spoon-v2.svg',
    action: 'sprinkle',
  },
  strawberry: {
    label: 'Strawberries',
    icon: '🍓',
    toolAsset: '/assets/tools/strawberry-spoon-v2.svg',
    action: 'scatter',
  },
  syrup: {
    label: 'Syrup',
    icon: '🍯',
    toolAsset: '/assets/tools/syrup-bottle.svg',
    action: 'drop',
  },
  cream: {
    label: 'Cream',
    icon: '☁️',
    toolAsset: '/assets/tools/cream-spoon-v2.svg',
    action: 'dollop',
  },
  butter: {
    label: 'Butter',
    icon: '🧈',
    toolAsset: '/assets/tools/butter-spoon-v2.svg',
    action: 'spread',
  },
};

export const ORDERS: Order[] = [
  {
    id: 'berry-burst',
    customer: 'Mina',
    avatar: '🧑🏽‍🦱',
    greeting: 'A berry burst, please!',
    toppings: { blueberry: 2, strawberry: 1 },
  },
  {
    id: 'sweet-cloud',
    customer: 'Theo',
    avatar: '🧑🏻‍🦰',
    greeting: 'Something sweet and fluffy!',
    toppings: { syrup: 1, cream: 1 },
  },
  {
    id: 'blueberry-stack',
    customer: 'Jules',
    avatar: '👩🏾',
    greeting: 'I love blueberries!',
    toppings: { blueberry: 3, cream: 1 },
  },
  {
    id: 'strawberry-drizzle',
    customer: 'Kai',
    avatar: '👨🏻‍🦱',
    greeting: 'Strawberries with a drizzle!',
    toppings: { strawberry: 2, syrup: 1 },
  },
  {
    id: 'berry-cloud',
    customer: 'Ari',
    avatar: '👩🏼‍🦰',
    greeting: 'Make mine berry cute!',
    toppings: { strawberry: 1, blueberry: 1, cream: 1 },
  },
  {
    id: 'buttery-brunch',
    customer: 'Robin',
    avatar: '🧑🏿‍🦲',
    greeting: 'Butter makes everything better!',
    toppings: { butter: 1, syrup: 1 },
  },
  {
    id: 'butter-berry',
    customer: 'Sam',
    avatar: '👩🏻‍🦱',
    greeting: 'A little butter with my berries!',
    toppings: { butter: 1, blueberry: 2 },
  },
  {
    id: 'citrus-cloud',
    customer: 'Noor',
    avatar: '👩🏽',
    greeting: 'A sunny pancake sounds lovely!',
    toppings: { cream: 1 },
  },
  {
    id: 'maple-morning',
    customer: 'Luca',
    avatar: '🧑🏻‍🦱',
    greeting: 'Something cozy for breakfast!',
    toppings: { syrup: 2 },
  },
  {
    id: 'berry-picnic',
    customer: 'Bea',
    avatar: '👩🏻‍🦰',
    greeting: 'A little treat for my picnic!',
    toppings: { strawberry: 1, blueberry: 1 },
  },
  {
    id: 'sweet-stack',
    customer: 'Remy',
    avatar: '🧑🏼‍🍳',
    greeting: 'Make it extra fluffy!',
    toppings: { cream: 2, butter: 1 },
  },
  {
    id: 'garden-party',
    customer: 'Imani',
    avatar: '👩🏿‍🦱',
    greeting: 'A colorful stack, please!',
    toppings: { strawberry: 1, cream: 1, blueberry: 1 },
  },
  {
    id: 'golden-hour',
    customer: 'Felix',
    avatar: '👨🏻‍🦰',
    greeting: 'Something warm and golden!',
    toppings: { butter: 1, syrup: 1 },
  },
  {
    id: 'cloud-nine',
    customer: 'Yuna',
    avatar: '👩🏻‍🦳',
    greeting: 'A dreamy little pancake!',
    toppings: { cream: 1, strawberry: 1 },
  },
  {
    id: 'weekend-stack',
    customer: 'Pablo',
    avatar: '👨🏽',
    greeting: 'A big weekend breakfast!',
    toppings: { blueberry: 2, butter: 1 },
  },
  {
    id: 'berry-brunch',
    customer: 'Nia',
    avatar: '👩🏾‍🦱',
    greeting: 'Bring on the berries!',
    toppings: { strawberry: 2, blueberry: 1 },
  },
  {
    id: 'maple-cloud',
    customer: 'Omar',
    avatar: '👨🏽‍🦱',
    greeting: 'A sweet and fluffy stack!',
    toppings: { syrup: 1, cream: 1, butter: 1 },
  },
  {
    id: 'butter-bloom',
    customer: 'Cleo',
    avatar: '👩🏼',
    greeting: 'A little something special!',
    toppings: { butter: 1 },
  },
  {
    id: 'sunny-side',
    customer: 'Mateo',
    avatar: '👨🏽‍🦰',
    greeting: 'A sunny-side stack, please!',
    toppings: { syrup: 1, strawberry: 1 },
  },
  {
    id: 'sprinkle-day',
    customer: 'Priya',
    avatar: '👩🏽‍🦱',
    greeting: 'A colorful stack would be fun!',
    toppings: { blueberry: 1, cream: 1, butter: 1 },
  },
  {
    id: 'cozy-cafe',
    customer: 'Ellis',
    avatar: '🧑🏼',
    greeting: 'A cozy cafe classic, please!',
    toppings: { syrup: 1, butter: 1 },
  },
  {
    id: 'strawberry-sunday',
    customer: 'Sasha',
    avatar: '👩🏻‍🦱',
    greeting: 'Strawberry Sunday, please!',
    toppings: { strawberry: 2 },
  },
  {
    id: 'berry-ballet',
    customer: 'Ava',
    avatar: '👩🏻',
    greeting: 'A sweet little berry stack!',
    toppings: { strawberry: 1, blueberry: 1 },
  },
  {
    id: 'sunny-syrup',
    customer: 'Maya',
    avatar: '👩🏽‍🦱',
    greeting: 'A sunny syrupy treat, please!',
    toppings: { syrup: 1, butter: 1 },
  },
  {
    id: 'cloud-cafe',
    customer: 'Zoe',
    avatar: '👩🏼‍🦰',
    greeting: 'A little cloud of cream!',
    toppings: { cream: 1, strawberry: 1 },
  },
  {
    id: 'ruby-brunch',
    customer: 'Ruby',
    avatar: '👩🏾',
    greeting: 'A ruby-red breakfast, please!',
    toppings: { strawberry: 2, syrup: 1 },
  },
  {
    id: 'ivy-garden',
    customer: 'Ivy',
    avatar: '👩🏻‍🦱',
    greeting: 'Something fresh and fluffy!',
    toppings: { blueberry: 1, cream: 1 },
  },
  {
    id: 'lila-sunrise',
    customer: 'Lila',
    avatar: '👩🏽‍🦰',
    greeting: 'A soft, sweet start to the day!',
    toppings: { butter: 1, syrup: 1, cream: 1 },
  },
  {
    id: 'hana-honey',
    customer: 'Hana',
    avatar: '👩🏾‍🦱',
    greeting: 'A cozy stack with berries!',
    toppings: { blueberry: 2, strawberry: 1 },
  },
  {
    id: 'rina-sweet-stack',
    customer: 'Rina',
    avatar: '👩🏼',
    greeting: 'A sweet stack to share!',
    toppings: { cream: 1, butter: 1 },
  },
];

export const TOPPING_COMBINATION_COUNT =
  (1 << TOPPING_ORDER.length) - 1;

const TOPPING_COMBINATIONS: Topping[][] = [];

for (let mask = 1; mask < 1 << TOPPING_ORDER.length; mask += 1) {
  const combination: Topping[] = [];
  TOPPING_ORDER.forEach((topping, index) => {
    if ((mask & (1 << index)) !== 0) combination.push(topping);
  });
  TOPPING_COMBINATIONS.push(combination);
}

export const getToppingCombinationKey = (
  toppings: Partial<Record<Topping, number>>
): string =>
  TOPPING_ORDER.filter((topping) => (toppings[topping] ?? 0) > 0).join('|');

export const getRandomOrder = (
  excludeCustomers: string[] = [],
  excludeCombinations: string[] = []
): Order => {
  const availableCustomers = ORDERS.filter(
    (order) => !excludeCustomers.includes(order.customer)
  );
  const candidates = availableCustomers.length > 0 ? availableCustomers : ORDERS;
  const customer = candidates[Math.floor(Math.random() * candidates.length)];

  if (!customer) {
    throw new Error('No pancake orders are configured.');
  }

  const availableCombinations = TOPPING_COMBINATIONS.filter(
    (combination) => !excludeCombinations.includes(combination.join('|'))
  );
  const availableCounts = [1, 2, 3, 4, 5].filter((count) =>
    availableCombinations.some((combination) => combination.length === count)
  );
  const toppingCount =
    availableCounts[Math.floor(Math.random() * availableCounts.length)] ?? 1;
  const countCombinations = availableCombinations.filter(
    (combination) => combination.length === toppingCount
  );
  const chosenCombination =
    countCombinations[Math.floor(Math.random() * countCombinations.length)] ??
    TOPPING_ORDER.slice(0, 1);

  const toppings: Partial<Record<Topping, number>> = {};

  for (const topping of chosenCombination) {
    toppings[topping] = Math.floor(Math.random() * 3) + 1;
  }

  return {
    ...customer,
    id: `${customer.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    greeting: [
      'Keep it simple and sweet, please!',
      'A couple of favorites, please!',
      'A tasty trio would be lovely!',
      "Let's make it extra special!",
      'A little bit of everything, please!',
    ][toppingCount - 1] ?? 'A fluffy pancake, please!',
    toppings,
  };
};
