import { List, RecordOf } from "immutable"
import { Direction } from "../Direction"

// PreExp
export type PreExpVar = { case: 'var', dat: { label: string } }
export type PreExpApp = { case: 'app', dat: { indentedArg: boolean } }
export type PreExpHol = { case: 'hol', dat: {} }

export type PreExp = PreExpVar | PreExpApp | PreExpHol

// Exp Exp <: PreExp having children be arrays is convenient for subtyping, but
// problematic for pure updating
export type Exp
    = PreExpVar & { kids: [] }
    | PreExpApp & { kids: [Exp, Exp] }
    | PreExpHol & { kids: [] }

// Zip
// Zip <: PreExp
export type Zip = PreExp & {
    kidsLeft: List<Exp>,
    kidsRight: List<Exp>
}

// Dat
export type Dat = {
    preExp: PreExp | undefined,
    indented: boolean
}

// TreePreExp

export type TreePreExp = { case: PreExp['case'], dat: PreExp['dat'] }

// TreeExp
export type TreeExp = TreePreExp & { kids: TreeExp[] }

export const toTreeExp = (exp: Exp): TreeExp => exp

// unsafe
export const fromTreeExp = (treeExp: TreeExp): Exp => treeExp as Exp

// unsafe
export const overTreeExp = (f: (t: TreeExp) => TreeExp) => (exp: Exp): Exp => f(exp) as Exp

// TreeZip
export type TreeZip = TreePreExp & { kidsLeft: List<TreeExp>, kidsRight: List<TreeExp> }

export const toTreeZip = (zip: Zip): TreeZip => zip

export const fromTreeZip = (treeZip: TreeZip): Zip => treeZip as Zip

// move

export function move(dir: Direction, zips: List<Zip>, exp: Exp): { zips: List<Zip>, exp: Exp } | undefined {
    switch (dir) {
        case 'up': {
            const zip = zips.get(0)
            if (zip === undefined) return undefined
            else return { zips: zips.shift(), exp: zipUp(zip, exp) }
        }
        case 'down': {
            const treeExp = toTreeExp(exp)
            const treeExpKid = treeExp.kids.at(0)
            if (treeExpKid === undefined) return undefined
            else return {
                zips: zips.unshift(fromTreeZip({
                    case: treeExp.case,
                    dat: treeExp.dat,
                    kidsLeft: List([]),
                    kidsRight: List(treeExp.kids).shift()
                })),
                exp: fromTreeExp(treeExpKid)
            }
        }
    }
}

// zipDown

// zipUp

export const zipUpTreeExp = (zip: Zip) => (treeExp: TreeExp): TreeExp => ({
    case: zip.case,
    dat: zip.dat,
    kids:
        zip.kidsLeft.reverse().map(toTreeExp)
            .concat(treeExp)
            .concat(zip.kidsRight.map(toTreeExp))
            .toArray()
})

export function zipsUpTreeExp(zips: List<Zip>): (treeExp: TreeExp) => TreeExp {
    const zip = zips.get(0)
    if (zip === undefined) return (treeExp) => treeExp
    else return (treeExp): TreeExp =>
        zipsUpTreeExp(zips.shift())
            (zipUpTreeExp(zip)(treeExp))
}

export const zipUp = (zip: Zip, exp: Exp): Exp =>
    fromTreeExp(zipUpTreeExp(zip)(toTreeExp(exp)))

export const zipsUpExp = (zips: List<Zip>, exp: Exp): Exp =>
    fromTreeExp(zipsUpTreeExp(zips)(toTreeExp(exp)))
