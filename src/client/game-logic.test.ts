import { describe, expect, it } from 'vitest';
import {
  addTopping,
  createEmptyToppingCounts,
  isOrderComplete,
} from './game-logic';
import type { Order } from './game-data';

const order: Order = {
  id: 'berry-burst',
  customer: 'Mina',
  avatar: '🙂',
  greeting: 'A berry burst, please!',
  toppings: { blueberry: 2, strawberry: 1 },
};

describe('pancake order checking', () => {
  it('accepts an exact topping match', () => {
    const toppings = {
      ...createEmptyToppingCounts(),
      blueberry: 2,
      strawberry: 1,
    };

    expect(isOrderComplete(order, toppings)).toBe(true);
  });

  it('rejects missing and extra toppings', () => {
    const missingTopping = {
      ...createEmptyToppingCounts(),
      blueberry: 2,
    };
    const extraTopping = {
      ...createEmptyToppingCounts(),
      blueberry: 2,
      strawberry: 1,
      syrup: 1,
    };

    expect(isOrderComplete(order, missingTopping)).toBe(false);
    expect(isOrderComplete(order, extraTopping)).toBe(false);
  });

  it('includes butter in the topping checklist', () => {
    const butterOrder: Order = {
      ...order,
      toppings: { butter: 1 },
    };
    const toppings = {
      ...createEmptyToppingCounts(),
      butter: 1,
    };

    expect(isOrderComplete(butterOrder, toppings)).toBe(true);
  });

  it('adds a topping without changing the previous counts', () => {
    const initialCounts = createEmptyToppingCounts();
    const updatedCounts = addTopping(initialCounts, 'blueberry');

    expect(updatedCounts.blueberry).toBe(1);
    expect(initialCounts.blueberry).toBe(0);
  });
});
