const __debug_level = 100

export function debug(level: number, ...xs: any[]) {
    console.log(...["[>]"].concat(xs))
}