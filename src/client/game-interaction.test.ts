import { describe, expect, it } from 'vitest';
import {
  createDrizzlePath,
  getPancakePoint,
  measureDrizzlePath,
} from './game-interaction';
import type { DrizzlePoint } from './game-interaction';

const pancakeBounds = {
  left: 100,
  top: 50,
  width: 200,
  height: 100,
};

describe('pancake drag interactions', () => {
  it('accepts points inside the pancake and rejects points outside its edge', () => {
    expect(getPancakePoint(pancakeBounds, 200, 100)).toEqual({
      x: 50,
      y: 50,
    });
    expect(getPancakePoint(pancakeBounds, 295, 100)).toEqual({
      x: 97.5,
      y: 50,
    });
    expect(getPancakePoint(pancakeBounds, 101, 51)).toBeNull();
    expect(getPancakePoint(undefined, 200, 100)).toBeNull();
  });

  it('starts a new syrup stroke after leaving the pancake so it cannot draw a spill line', () => {
    const points: DrizzlePoint[] = [
      { x: 10, y: 50, startsSegment: true },
      { x: 20, y: 50, startsSegment: false },
      { x: 90, y: 50, startsSegment: true },
      { x: 95, y: 50, startsSegment: false },
    ];

    expect(createDrizzlePath(points)).toBe('M 10 50 L 20 50 M 90 50 L 95 50');
    expect(measureDrizzlePath(points)).toBe(15);
  });
});
