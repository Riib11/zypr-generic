import { List, RecordOf } from "immutable"

// PreExp
export type PreExpVar = { case: 'var', dat: { label: string } }
export type PreExpApp = { case: 'app', dat: { indentedArg: boolean } }
export type PreExpHol = { case: 'hol', dat: {} }

export type PreExp = PreExpVar | PreExpApp | PreExpHol

// Exp
// Exp <: PreExp
export type Exp
    = PreExpVar & { kids: [] }
    | PreExpApp & { kids: [Exp, Exp] }
    | PreExpHol & { kids: [] }

export type TreeExp = { case: Exp['case'], dat: Exp['dat'], kids: TreeExp[] }

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

export function toTreeExp(exp: Exp): TreeExp {
    return exp
}

// unsafe
export function fromTreeExp(treeExp: TreeExp): Exp {
    return treeExp as Exp // unsafe
}

export function wrapZipTreeExp(zips: List<Zip>): (treeExp: TreeExp) => TreeExp {
    const zip = zips.get(0)
    if (zip === undefined) return (treeExp) => treeExp
    else return (treeExp): TreeExp => ({
        case: treeExp.case,
        dat: treeExp.dat,
        kids:
            zip.kidsLeft.reverse().map(toTreeExp)
                .concat(treeExp)
                .concat(zip.kidsRight.map(toTreeExp))
                .toArray()
    })
}

export function wrapZipExp(zips: List<Zip>, exp: Exp): Exp {
    return fromTreeExp(wrapZipTreeExp(zips)(toTreeExp(exp)))
}