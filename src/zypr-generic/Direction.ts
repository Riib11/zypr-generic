export type Direction = 'up' | 'down' | 'left' | 'right'


export function directionFromKey(key: string): Direction | undefined {
  if (key === 'ArrowUp') return 'up';
  else if (key === 'ArrowDown') return 'down';
  else if (key === 'ArrowLeft') return 'left';
  else if (key === 'ArrowRight') return 'right';
}