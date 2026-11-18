import { TOPPING_ORDER } from './game-data';
import type { Order, Topping, ToppingCounts } from './game-data';

export const createEmptyToppingCounts = (): ToppingCounts => ({
  blueberry: 0,
  strawberry: 0,
  syrup: 0,
  cream: 0,
  butter: 0,
});

export const addTopping = (
  counts: ToppingCounts,
  topping: Topping
): ToppingCounts => ({
  ...counts,
  [topping]: counts[topping] + 1,
});

export const isOrderComplete = (
  order: Order,
  selectedToppings: ToppingCounts
): boolean =>
  TOPPING_ORDER.every(
    (topping) => selectedToppings[topping] === (order.toppings[topping] ?? 0)
  );

export const getStreakTip = (nextStreak: number): number =>
  nextStreak > 0 && nextStreak % 3 === 0 ? 5 : 0;
