import { List, RecordOf } from "immutable"
import { Cursor, Mode, Select } from "../Backend"
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

export const mkVar = (label: string): Exp => ({ case: 'var', dat: { label }, kids: [] })
export const mkApp = (apl: Exp, arg: Exp, indentedArg?: boolean) => ({ case: 'app', dat: { indentedArg: indentedArg ?? false }, kids: [apl, arg] })
export const mkHol = (): Exp => ({ case: 'hol', dat: {}, kids: [] })

// Zip
// Zip <: PreExp
export type Zip = PreExp & {
    kidsLeft: List<Exp>,
    kidsRight: List<Exp>
}

// Dat
export type Dat = {
    preExp: PreExp,
    isParenthesized: boolean,
    isApp: boolean,
    indent: number | undefined
}

// 

export function unzipExp(zip: Zip, exp: Exp): Exp {
    return {
        case: zip.case,
        dat: zip.dat,
        kids: ([] as Exp[]).concat(zip.kidsLeft.reverse().toArray(), [exp], zip.kidsRight.toArray())
    } as Exp
}

export function zipExp(exp: Exp, i: number): Zip {
    return {
        case: exp.case,
        dat: exp.dat,
        kidsLeft: List(exp.kids.slice(undefined, i)),
        kidsRight: List(exp.kids.slice(i + 1, undefined))
    } as Zip
}

// move

export function moveCursor(
    dir: Direction,
    cursor: Cursor<Exp, Zip>
): Cursor<Exp, Zip> | undefined {
    switch (dir) {
        case 'up': {
            const zip = cursor.zips.get(0)
            if (zip === undefined) return undefined
            return { zips: cursor.zips.shift(), exp: zipUp(zip, cursor.exp) }
        }
        case 'down': {
            const treeExp = toTreeExp(cursor.exp)
            const treeExpKid = treeExp.kids.at(0)
            if (treeExpKid === undefined) return undefined
            return {
                zips: cursor.zips.unshift(fromTreeZip({
                    case: treeExp.case,
                    dat: treeExp.dat,
                    kidsLeft: List([]),
                    kidsRight: List(treeExp.kids).shift()
                })),
                exp: fromTreeExp(treeExpKid)
            }
        }
        case 'left': {
            const zip = cursor.zips.get(0)
            if (zip === undefined) return undefined
            const tzip = toTreeZip(zip)
            const texp = tzip.kidsLeft.get(0)
            if (texp === undefined) return undefined
            const tzipNew: TreeZip = {
                case: tzip.case,
                dat: tzip.dat,
                kidsLeft: tzip.kidsLeft.shift(),
                kidsRight: tzip.kidsRight.unshift(cursor.exp)
            }
            return {
                zips: cursor.zips.shift().unshift(fromTreeZip(tzipNew)),
                exp: fromTreeExp(texp)
            }
        }
        case 'right': {
            const zip = cursor.zips.get(0)
            if (zip === undefined) return undefined
            const tzip = toTreeZip(zip)
            const texp = tzip.kidsRight.get(0)
            if (texp === undefined) return undefined
            const tzipNew: TreeZip = {
                case: tzip.case,
                dat: tzip.dat,
                kidsLeft: tzip.kidsLeft.unshift(cursor.exp),
                kidsRight: tzip.kidsRight.shift()
            }
            return {
                zips: cursor.zips.shift().unshift(fromTreeZip(tzipNew)),
                exp: fromTreeExp(texp)
            }
        }
    }
}

export function moveSelect(
    dir: Direction,
    select: Select<Exp, Zip>
): Select<Exp, Zip> | undefined {
    switch (dir) {
        case 'up': {
            switch (select.orient) {
                case 'top': {
                    const zip = select.zipsTop.get(0)
                    if (zip === undefined) return undefined
                    return {
                        zipsTop: select.zipsTop.shift(),
                        zipsBot: select.zipsBot.concat(zip),
                        exp: select.exp,
                        orient: select.orient
                    }
                }
                case 'bot': {
                    const zip = select.zipsBot.get(0)
                    if (zip === undefined) return undefined
                    return {
                        zipsTop: select.zipsTop,
                        zipsBot: select.zipsBot.shift(),
                        exp: zipUp(zip, select.exp),
                        orient: select.orient
                    }
                }
            }
        }
        case 'down': {
            switch (select.orient) {
                case 'top': {
                    const zip = select.zipsBot.get(0)
                    if (zip === undefined) return undefined
                    return {
                        zipsTop: select.zipsTop.unshift(zip),
                        zipsBot: select.zipsBot.shift(),
                        exp: select.exp,
                        orient: select.orient
                    }
                }
                case 'bot': {
                    const treeExp = toTreeExp(select.exp)
                    const treeExpKid = treeExp.kids.at(0)
                    if (treeExpKid === undefined) return undefined
                    return {
                        zipsTop: select.zipsTop,
                        zipsBot: select.zipsBot.unshift(fromTreeZip({
                            case: treeExp.case,
                            dat: treeExp.dat,
                            kidsLeft: List([]),
                            kidsRight: List(treeExp.kids).shift()
                        })),
                        exp: fromTreeExp(treeExpKid),
                        orient: select.orient
                    }
                }
            }
        }
        case 'left': {
            switch (select.orient) {
                case 'top': return undefined
                case 'bot': {
                    const zip = select.zipsBot.get(0)
                    if (zip === undefined) return undefined
                    const tzip = toTreeZip(zip)
                    const texp = tzip.kidsLeft.get(0)
                    if (texp === undefined) return undefined
                    const tzipNew: TreeZip = {
                        case: tzip.case,
                        dat: tzip.dat,
                        kidsLeft: tzip.kidsLeft.shift(),
                        kidsRight: tzip.kidsRight.unshift(select.exp)
                    }
                    return {
                        zipsTop: select.zipsTop,
                        zipsBot: select.zipsBot.shift().unshift(fromTreeZip(tzipNew)),
                        exp: fromTreeExp(texp),
                        orient: select.orient
                    }
                }
            }
        }
        case 'right': {
            switch (select.orient) {
                case 'top': return undefined
                case 'bot': {
                    const zip = select.zipsBot.get(0)
                    if (zip === undefined) return undefined
                    const tzip = toTreeZip(zip)
                    const texp = tzip.kidsRight.get(0)
                    if (texp === undefined) return undefined
                    const tzipNew: TreeZip = {
                        case: tzip.case,
                        dat: tzip.dat,
                        kidsLeft: tzip.kidsLeft.unshift(select.exp),
                        kidsRight: tzip.kidsRight.shift(),
                    }
                    return {
                        zipsTop: select.zipsTop,
                        zipsBot: select.zipsBot.shift().unshift(fromTreeZip(tzipNew)),
                        exp: fromTreeExp(texp),
                        orient: select.orient
                    }
                }
            }
        }
    }
}

export function fixSelect(select: Select<Exp, Zip>): Mode<Exp, Zip> {
    if (select.zipsBot.isEmpty())
        return { case: 'cursor', cursor: { zips: select.zipsTop, exp: select.exp } }
    else
        return { case: 'select', select }
}


// TreePreExp

export type TreePreExp = { case: PreExp['case'], dat: PreExp['dat'] }

export const toTreePreExp = <PE extends PreExp>(pex: PE): TreePreExp => pex

export const fromTreePreExp = <PE extends PreExp>(treePex: TreePreExp): PE => treePex as PE

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
