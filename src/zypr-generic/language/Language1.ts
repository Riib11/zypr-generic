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
        case 'left': {
            const zip = zips.get(0)
            if (zip === undefined) return undefined
            else {
                const res = zipLeft(zip, exp)
                if (res === undefined) return undefined
                return {
                    zips: zips.shift().unshift(res.zip),
                    exp: res.exp
                }
            }
        }
        case 'right': {
            const zip = zips.get(0)
            if (zip === undefined) return undefined
            else {
                const res = zipRight(zip, exp)
                if (res === undefined) return undefined
                return {
                    zips: zips.shift().unshift(res.zip),
                    exp: res.exp
                }
            }
        }
    }
}

// zipLeft

export const zipLeft = (zip: Zip, exp: Exp): { zip: Zip, exp: Exp } | undefined => {
    const res = zipLeftTree(toTreeZip(zip), toTreeExp(exp))
    if (res === undefined) return undefined
    else return { zip: fromTreeZip(res.treeZip), exp: fromTreeExp(res.treeExp) }
}

export const zipLeftTree =
    (treeZip: TreeZip, treeExp: TreeExp): { treeZip: TreeZip, treeExp: TreeExp } | undefined => {
        const treeExpNew = treeZip.kidsLeft.get(0)
        if (treeExpNew === undefined) return undefined
        else return {
            treeZip: {
                case: treeZip.case,
                dat: treeZip.dat,
                kidsLeft: treeZip.kidsLeft.shift(),
                kidsRight: treeZip.kidsRight.unshift(treeExp)
            },
            treeExp: treeExpNew
        }
    }

// zipRight

export const zipRight = (zip: Zip, exp: Exp): { zip: Zip, exp: Exp } | undefined => {
    const res = zipRightTree(toTreeZip(zip), toTreeExp(exp))
    if (res === undefined) return undefined
    else return { zip: fromTreeZip(res.treeZip), exp: fromTreeExp(res.treeExp) }
}

export const zipRightTree =
    (treeZip: TreeZip, treeExp: TreeExp): { treeZip: TreeZip, treeExp: TreeExp } | undefined => {
        const treeExpNew = treeZip.kidsRight.get(0)
        if (treeExpNew === undefined) return undefined
        else return {
            treeZip: {
                case: treeZip.case,
                dat: treeZip.dat,
                kidsLeft: treeZip.kidsLeft.unshift(treeExp),
                kidsRight: treeZip.kidsRight.shift()
            },
            treeExp: treeExpNew
        }
    }

// zipUp

export const zipUpTree = (zip: Zip) => (treeExp: TreeExp): TreeExp => ({
    case: zip.case,
    dat: zip.dat,
    kids:
        zip.kidsLeft.reverse().map(toTreeExp)
            .concat(treeExp)
            .concat(zip.kidsRight.map(toTreeExp))
            .toArray()
})

export function zipsUpTree(zips: List<Zip>): (treeExp: TreeExp) => TreeExp {
    const zip = zips.get(0)
    if (zip === undefined) return (treeExp) => treeExp
    else return (treeExp): TreeExp =>
        zipsUpTree(zips.shift())
            (zipUpTree(zip)(treeExp))
}

export const zipUp = (zip: Zip, exp: Exp): Exp =>
    fromTreeExp(zipUpTree(zip)(toTreeExp(exp)))

export const zipsUp = (zips: List<Zip>, exp: Exp): Exp =>
    fromTreeExp(zipsUpTree(zips)(toTreeExp(exp)))
