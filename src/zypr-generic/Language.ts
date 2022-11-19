import assert from "assert"
import { List } from "immutable"
import { Cursor, getZipsBot, Mode, Orient, Select } from "./Backend"
import { Direction } from "./Direction"

export type Grammar<Met, Rul, Val> =
    {
        rules: (met: Met) => Rul[], // this meta can be produced by these rules
        valueDefault: (rul: Rul) => Val, // this rule has this default value
        kids: (rul: Rul) => Met[], // this rule has these children metas
        holeRule: (met: Met) => Rul, // this meta can be produced by this hole rule
        // whether the exp at a zips is parethesized
        isParenthesized: (zips: List<Zip<Met, Rul, Val>>, exp: Exp<Met, Rul, Val>) => boolean,
        isIndentable: (zips: List<Zip<Met, Rul, Val>>, exp: Exp<Met, Rul, Val>) => boolean,
    }

export function buildGrammar<Met extends string, Rul extends string, Val>(
    args: {
        rules: { [met in Met]: Rul[] },
        valueDefault: { [rul in Rul]: Val },
        kids: { [rul in Rul]: Met[] },
        holeRule: { [met in Met]: Rul },
        isParenthesized: Grammar<Met, Rul, Val>['isParenthesized'],
        isIndentable: Grammar<Met, Rul, Val>['isIndentable'],
    },
): Grammar<Met, Rul, Val> {
    return {
        ...args,
        rules: (met) => args.rules[met],
        valueDefault: (rul) => args.valueDefault[rul],
        kids: (rul) => args.kids[rul],
        holeRule: (met) => args.holeRule[met],
    }
}

export function isValidRuleKidI<Met, Rul, Val>
    (gram: Grammar<Met, Rul, Val>, rul: Rul, i: number): boolean {
    return 0 <= i && i < gram.kids(rul).length
}

export function verifyRuleKidI<Met, Rul, Val>(gram: Grammar<Met, Rul, Val>, rul: Rul, i: number): void {
    assert(
        0 <= i && i < gram.kids(rul).length,
        "[verifyRuleKidI] for rule '" + rul + "', the kid index '" + i + "' is invalid"
    )
}

// pre-expression
export type Pre<Met, Rul, Val> = {
    met: Met,
    rul: Rul,
    val: Val
}

// expression
export type Exp<Met, Rul, Val> = {
    met: Met,
    rul: Rul,
    val: Val,
    kids: List<Exp<Met, Rul, Val>>
}

// verify exp
export function verifyExp<Met, Rul, Val>(
    gram: Grammar<Met, Rul, Val>,
    exp: Exp<Met, Rul, Val>
): Exp<Met, Rul, Val> {
    const kidMets = gram.kids(exp.rul)
    assert(
        kidMets.length === exp.kids.size,
        "[verifyExp] for exp '" + exp + "', the number of kids is invalid"
    )
    exp.kids.zip(List(kidMets)).forEach(([kid, met]) =>
        assert(
            kid.met === met,
            "[verifyExp] for exp '" + exp +
            "', the meta of kid '" + kid + "' is invalid "
        ))
    return exp
}

export function makeHole<Met, Rul, Val>(
    gram: Grammar<Met, Rul, Val>,
    met: Met
): Exp<Met, Rul, Val> {
    return verifyExp(gram, {
        met: met,
        rul: gram.holeRule(met),
        val: gram.valueDefault(gram.holeRule(met)),
        kids: List([]),
    })
}

export function makeExpTemplate<Met, Rul, Val>(
    gram: Grammar<Met, Rul, Val>,
    met: Met,
    rul: Rul,
    val: Val
): Exp<Met, Rul, Val> {
    return verifyExp(gram, {
        met, rul, val,
        kids: List(gram.kids(rul).map((met) => makeHole(gram, met)))
    })
}

export function eqExp<Met, Rul, Val>(
    exp1: Exp<Met, Rul, Val>,
    exp2: Exp<Met, Rul, Val>
): boolean {
    return (
        exp1.met === exp2.met &&
        exp1.rul === exp2.rul &&
        exp1.val === exp2.val &&
        exp1.kids.zip(exp2.kids).reduceRight((b, [kid1, kid2]) =>
            b && eqExp(kid1, kid2))
    )
}

// zipper step
export type Zip<Met, Rul, Val> = {
    met: Met,
    rul: Rul,
    val: Val,
    kidsLeft: List<Exp<Met, Rul, Val>>,
    kidsRight: List<Exp<Met, Rul, Val>>
}

// verify zip
export function verifyZip<Met, Rul, Val>(gram: Grammar<Met, Rul, Val>, zip: Zip<Met, Rul, Val>): Zip<Met, Rul, Val> {
    const kidMets = gram.kids(zip.rul)
    assert(
        kidMets.length === zip.kidsLeft.size + zip.kidsRight.size + 1,
        "[verifyZip] for zip '" + zip + "', the number of kids is invalid"
    )
    zip.kidsLeft.reverse().zip(List(kidMets.slice(undefined, zip.kidsLeft.size)))
        .forEach(([kid, met]) => assert(
            kid.met === met,
            "[verifyZip] for zip '" + zip +
            "', the meta of kid '" + kid + "' is invalid"
        ))
    zip.kidsRight.zip(List(kidMets.slice(undefined, zip.kidsLeft.size)))
        .forEach(([kid, met]) => assert(
            kid.met === met,
            "[verifyZip] for zip '" + zip +
            "', the meta of kid '" + kid + "' is invalud"
        ))
    return zip
}

export function makeZipTemplate<Met, Rul, Val>(
    gram: Grammar<Met, Rul, Val>,
    met: Met,
    rul: Rul,
    val: Val,
    i: number
): Zip<Met, Rul, Val> {
    return verifyZip(gram, {
        met, rul, val,
        kidsLeft: List(gram.kids(rul).slice(undefined, i).map((met) => makeHole(gram, met)).reverse()),
        kidsRight: List(gram.kids(rul).slice(i + 1, undefined).map((met) => makeHole(gram, met)))
    })
}

export function eqZip<Met, Rul, Val>(
    zip1: Zip<Met, Rul, Val>,
    zip2: Zip<Met, Rul, Val>
): boolean {
    return (
        zip1.met === zip2.met &&
        zip1.rul === zip2.rul &&
        zip1.val === zip2.val &&
        zip1.kidsLeft.size === zip2.kidsLeft.size &&
        zip1.kidsRight.size === zip2.kidsRight.size
    )
}

export function eqZips<Met, Rul, Val>(
    zips1: List<Zip<Met, Rul, Val>>,
    zips2: List<Zip<Met, Rul, Val>>
): boolean {
    return (
        zips1.size === zips2.size &&
        zips1.zip(zips2)
            .reduce((b, [zip1, zip2]) => b && eqZip(zip1, zip2), true)
    )
}

export function makeZipTemplates<Met, Rul, Val>(
    gram: Grammar<Met, Rul, Val>,
    met: Met, rul: Rul, val: Val
): Zip<Met, Rul, Val>[] {
    return gram.kids(rul).map((_kidMet, i) => makeZipTemplate(gram, met, rul, val, i))
}

// the index of the zip's hole
export function iZip<Met, Rul, Val>(zip: Zip<Met, Rul, Val>): number {
    return zip.kidsLeft.size
}

export function zipExp<Met, Rul, Val>(
    gram: Grammar<Met, Rul, Val>,
    exp: Exp<Met, Rul, Val>,
    i: number
): { zip: Zip<Met, Rul, Val>, exp: Exp<Met, Rul, Val> } | undefined {
    if (!isValidRuleKidI(gram, exp.rul, i)) return undefined
    return {
        zip: {
            met: exp.met,
            rul: exp.rul,
            val: exp.val,
            kidsLeft: exp.kids.slice(undefined, i).reverse(),
            kidsRight: exp.kids.slice(i + 1, undefined)
        },
        exp: exp.kids.get(i) as Exp<Met, Rul, Val>
    }
}

export function unzipExp<Met, Rul, Val>(
    gram: Grammar<Met, Rul, Val>,
    zip: Zip<Met, Rul, Val>,
    exp: Exp<Met, Rul, Val>
) {
    const kidMets = gram.kids(zip.rul)
    // verify that exp can fit into zip
    assert(kidMets[zip.kidsLeft.size] === exp.met)
    return {
        met: zip.met,
        rul: zip.rul,
        val: zip.val,
        kids: List([]).concat(
            zip.kidsLeft.reverse(),
            List([exp]),
            zip.kidsRight)
    }
}

export function unzipsExp<Met, Rul, Val>(
    gram: Grammar<Met, Rul, Val>,
    zips: List<Zip<Met, Rul, Val>>,
    exp: Exp<Met, Rul, Val>
):
    Exp<Met, Rul, Val> {
    const zip = zips.get(0)
    if (zip === undefined) return exp
    return unzipsExp(gram, zips.shift(), unzipExp(gram, zip, exp))
}

export function enterCursor<Met, Rul, Val>(
    gram: Grammar<Met, Rul, Val>,
    mode: Mode<Met, Rul, Val>
):
    Cursor<Met, Rul, Val> {
    switch (mode.case) {
        case 'cursor': return mode.cursor
        case 'select': return {
            zips: mode.select.zipsTop,
            exp: unzipsExp(gram, getZipsBot(mode.select), mode.select.exp)
        }
    }
}

export function moveCursor<Met, Rul, Val>(
    gram: Grammar<Met, Rul, Val>,
    dir: Direction,
    // cursor: Cursor<Exp<Met, Rul, Val>, Zip<Met, Rul, Val>>
    mode: Mode<Met, Rul, Val>
): Mode<Met, Rul, Val> | undefined {
    const cursor = enterCursor(gram, mode)
    switch (dir.case) {
        case 'up': {
            const zip = cursor.zips.get(0)
            if (zip === undefined) return undefined
            return {
                case: 'cursor',
                cursor: {
                    zips: cursor.zips.shift(),
                    exp: unzipExp(gram, zip, cursor.exp)
                }
            }
        }
        case 'down': {
            const res = zipExp(gram, cursor.exp, dir.i)
            if (res === undefined) return undefined
            return {
                case: 'cursor',
                cursor: {
                    zips: cursor.zips.unshift(res.zip),
                    exp: res.exp
                }
            }
        }
        case 'left': {
            const cursorPar = moveCursor(gram, { case: 'up' }, { case: 'cursor', cursor })
            const zip = cursor.zips.get(0)
            if (cursorPar === undefined || zip === undefined) return undefined
            const i = iZip(zip) - 1
            if (!isValidRuleKidI(gram, zip.rul, i)) return undefined
            return moveCursor(gram, { case: 'down', i }, cursorPar)
        }
        case 'right': {
            const cursorPar = moveCursor(gram, { case: 'up' }, { case: 'cursor', cursor })
            const zip = cursor.zips.get(0)
            if (cursorPar === undefined || zip === undefined) return undefined
            const i = iZip(zip) + 1
            if (!isValidRuleKidI(gram, zip.rul, i)) return undefined
            return moveCursor(gram, { case: 'down', i }, cursorPar)
        }
    }
}

export function fixSelect<Met, Rul, Val>(
    gram: Grammar<Met, Rul, Val>,
    select: Select<Met, Rul, Val>
):
    Mode<Met, Rul, Val> {
    if (select.zipsBot.isEmpty())
        return {
            case: 'cursor',
            cursor: { zips: select.zipsTop, exp: select.exp }
        }
    else return { case: 'select', select }
}

export function enterSelect<Met, Rul, Val>(
    mode: Mode<Met, Rul, Val>,
    orient: Orient,
):
    Select<Met, Rul, Val> {
    switch (mode.case) {
        case 'cursor': return {
            zipsTop: mode.cursor.zips,
            zipsBot: List([]),
            exp: mode.cursor.exp,
            orient
        }
        case 'select': return mode.select
    }
}

export function moveSelect<Met, Rul, Val>(
    gram: Grammar<Met, Rul, Val>,
    dir: Direction,
    mode: Mode<Met, Rul, Val>
):
    Mode<Met, Rul, Val> | undefined {
    const select: Select<Met, Rul, Val> =
        enterSelect(
            mode,
            ((): Orient => {
                switch (dir.case) {
                    case 'up': return 'top'
                    case 'down': return 'bot'
                    case 'left': return 'bot'
                    case 'right': return 'bot'
                }
            })())
    switch (dir.case) {
        case 'up': {
            switch (select.orient) {
                case 'top': {
                    const zip = select.zipsTop.get(0)
                    if (zip === undefined) return undefined
                    return fixSelect(gram, {
                        zipsTop: select.zipsTop.shift(),
                        zipsBot: select.zipsBot.unshift(zip),
                        exp: select.exp,
                        orient: 'top'
                    })
                }
                case 'bot': {
                    const zip = select.zipsBot.get(0)
                    if (zip === undefined) return undefined
                    return fixSelect(gram, {
                        zipsTop: select.zipsTop,
                        zipsBot: select.zipsBot.shift(),
                        exp: unzipExp(gram, zip, select.exp),
                        orient: 'bot'
                    })
                }
            }
        }
        case 'down': {
            switch (select.orient) {
                case 'top': {
                    const zip = select.zipsBot.get(0)
                    if (zip === undefined) return undefined
                    return fixSelect(gram, {
                        zipsTop: select.zipsTop.unshift(zip),
                        zipsBot: select.zipsBot.shift(),
                        exp: select.exp,
                        orient: 'top'
                    })
                }
                case 'bot': {
                    const res = zipExp(gram, select.exp, dir.i)
                    if (res === undefined) return undefined
                    const { exp, zip } = res
                    return fixSelect(gram, {
                        zipsTop: select.zipsTop,
                        zipsBot: select.zipsBot.unshift(zip),
                        exp: exp,
                        orient: 'bot'
                    })
                }
            }
        }
        case 'left': {
            if (select.orient === 'top') return undefined

            const selectPar = moveSelect(gram, { case: 'up' }, mode)
            const zip = select.zipsBot.get(0)
            if (selectPar === undefined || zip === undefined) return undefined

            const i = iZip(zip) - 1
            if (!isValidRuleKidI(gram, zip.rul, i)) return undefined

            return moveSelect(gram, { case: 'down', i }, selectPar)
        }
        case 'right': {
            if (select.orient === 'top') return undefined
            const selectPar = moveSelect(gram, { case: 'up' }, mode)
            const zip = select.zipsBot.get(0)
            if (selectPar === undefined || zip === undefined) return undefined

            const i = iZip(zip) + 1
            if (!isValidRuleKidI(gram, zip.rul, i)) return undefined

            return moveSelect(gram, { case: 'down', i }, selectPar)
        }
    }
}

