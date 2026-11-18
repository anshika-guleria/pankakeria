export type PancakePoint = {
  x: number;
  y: number;
};

export type DrizzlePoint = PancakePoint & {
  startsSegment: boolean;
};

export type PancakeBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export const getPancakePoint = (
  bounds: PancakeBounds | undefined,
  clientX: number,
  clientY: number
): PancakePoint | null => {
  if (!bounds || bounds.width === 0 || bounds.height === 0) {
    return null;
  }

  const x = (clientX - bounds.left) / bounds.width;
  const y = (clientY - bounds.top) / bounds.height;
  const ellipseDistance = ((x - 0.5) / 0.5) ** 2 + ((y - 0.5) / 0.5) ** 2;

  if (ellipseDistance > 1) {
    return null;
  }

  return {
    x: Math.round(x * 1000) / 10,
    y: Math.round(y * 1000) / 10,
  };
};

export const createDrizzlePath = (points: DrizzlePoint[]): string =>
  points
    .map(
      (point, index) =>
        `${index === 0 || point.startsSegment ? 'M' : 'L'} ${point.x} ${point.y}`
    )
    .join(' ');

export const measureDrizzlePath = (points: DrizzlePoint[]): number => {
  let length = 0;

  for (let index = 1; index < points.length; index += 1) {
    const current = points[index];
    const previous = points[index - 1];
    if (!current || !previous || current.startsSegment) {
      continue;
    }

    length += Math.hypot(current.x - previous.x, current.y - previous.y);
  }

  return length;
};
