export type Direction
    = { case: 'up' }
    | { case: 'down', i: number }
    | { case: 'left' }
    | { case: 'right' }
// | 'prev' | 'next'