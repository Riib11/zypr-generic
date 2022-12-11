import assert from "assert"
import { List } from "immutable"
import { Mode } from "./Backend"
import { Direction } from "./Direction"

export type Grammar<Met, Rul, Val> = {
    rules: (met: Met) => Rul[], // this meta can be produced by these rules
    valueDefault: (rul: Rul) => Val, // this rule has this default value
    kids: (rul: Rul) => Met[], // this rule has these children metas
    holeRule: (met: Met) => Rul, // this meta can be produced by this hole rule
}

export type Language<Met, Rul, Val> = {
    grammar: Grammar<Met, Rul, Val>,
    isParenthesized: (zips: List<Zip<Met, Rul, Val>>, exp: Exp<Met, Rul, Val>) => boolean,
    modifyIndent: (f: (isIndented: boolean) => boolean, zip: Zip<Met, Rul, Val>) => Zip<Met, Rul, Val> | undefined,
    isValidSelect: (select: Select<Met, Rul, Val>) => boolean
    isValidCursor: (cursor: Cursor<Met, Rul, Val>) => boolean
}

export type Cursor<Met, Rul, Val> = { zips: List<Zip<Met, Rul, Val>>, exp: Exp<Met, Rul, Val> }

export type Select<Met, Rul, Val> = { zipsTop: List<Zip<Met, Rul, Val>>, zipsBot: List<Zip<Met, Rul, Val>>, exp: Exp<Met, Rul, Val>, orient: Orient }

// top: the top of the select can move
// bot: the bot of the select can move
export type Orient = 'top' | 'bot'


export function getZipsBot<Met, Rul, Val>(select: Select<Met, Rul, Val>) {
    return toZipsBot(select.orient, select.zipsBot)
}

export function setZipsBot<Met, Rul, Val>(select: Select<Met, Rul, Val>, zips: List<Zip<Met, Rul, Val>>) {
    return { ...select, zipsBot: toZipsBot(select.orient, zips) }
}

export function toZipsBot<Met, Rul, Val>(orient: Orient, zips: List<Zip<Met, Rul, Val>>) {
    switch (orient) {
        case 'top': return zips.reverse()
        case 'bot': return zips
    }
}

export function isValidRuleKidI<Met, Rul, Val>
    (gram: Grammar<Met, Rul, Val>, rul: Rul, i: number): boolean {
    return 0 <= i && i < gram.kids(rul).length
}

export function verifyRuleKidI<Met, Rul, Val>(gram: Grammar<Met, Rul, Val>, rul: Rul, i: number): void {
    // TODO: tmp disable
    // assert(
    //     0 <= i && i < gram.kids(rul).length,
    //     "[verifyRuleKidI] for rule '" + rul + "', the kid index '" + i + "' is invalid"
    // )
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
    // TODO: tmp disable
    // assert(
    //     kidMets.length === exp.kids.size,
    //     "[verifyExp] for exp '" + exp + "', the number of kids is invalid"
    // )
    exp.kids.zip(List(kidMets)).forEach(([kid, met]) => {
        // TODO: tmp disable
        // assert(
        //     kid.met === met,
        //     "[verifyExp] for exp '" + exp +
        //     "', the meta of kid '" + kid + "' is invalid ")
    }
    )
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
    // TODO: tmp disable
    // assert(
    //     kidMets.length === zip.kidsLeft.size + zip.kidsRight.size + 1,
    //     "[verifyZip] for zip '" + zip + "', the number of kids is invalid"
    // )
    // TODO: tmp disable
    // zip.kidsLeft.reverse().zip(List(kidMets.slice(undefined, zip.kidsLeft.size)))
    //     .forEach(([kid, met]) => {
    //         assert(
    //             kid.met === met,
    //             "[verifyZip] for zip '" + zip +
    //             "', the meta of kid '" + kid + "' is invalid"
    //         )
    //     })
    // TODO: tmp disable
    // zip.kidsRight.zip(List(kidMets.slice(undefined, zip.kidsLeft.size)))
    //     .forEach(([kid, met]) => {
    //         assert(
    //             kid.met === met,
    //             "[verifyZip] for zip '" + zip +
    //             "', the meta of kid '" + kid + "' is invalud"
    //         )
    //     })
    return zip
}

export function toggleIndent<Met, Rul, Val>
    (lang: Language<Met, Rul, Val>, zip: Zip<Met, Rul, Val>): Zip<Met, Rul, Val> | undefined {
    return lang.modifyIndent((b: boolean) => !b, zip)
}

export function makeZipTemplate<Met, Rul, Val>(
    gram: Grammar<Met, Rul, Val>,
    met: Met,
    rul: Rul,
    val: Val,
    i: number,
    metBot: Met
): Zip<Met, Rul, Val> | undefined {
    if (gram.kids(rul)[i] !== metBot) return undefined
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
    met: Met, rul: Rul, val: Val,
    metBot: Met
): Zip<Met, Rul, Val>[] {
    return gram.kids(rul).flatMap((_kidMet, i) => makeZipTemplate(gram, met, rul, val, i, metBot) ?? [])
}

// the index of the zip's hole
export function iZip<Met, Rul, Val>(zip: Zip<Met, Rul, Val>): number {
    return zip.kidsLeft.size
}

export function zipExp<Met, Rul, Val>(
    gram: Grammar<Met, Rul, Val>, exp: Exp<Met, Rul, Val>, i: number
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

export function zipRight<Met, Rul, Val>
    (gram: Grammar<Met, Rul, Val>, zip: Zip<Met, Rul, Val>, exp0: Exp<Met, Rul, Val>
    ): { zip: Zip<Met, Rul, Val>, exp: Exp<Met, Rul, Val> } | undefined {
    const exp1 = zip.kidsRight.get(0)
    if (exp1 === undefined) return undefined
    return { zip: { ...zip, kidsLeft: zip.kidsLeft.unshift(exp0), kidsRight: zip.kidsRight.shift() }, exp: exp1 }
}

export function zipLeft<Met, Rul, Val>
    (gram: Grammar<Met, Rul, Val>, zip: Zip<Met, Rul, Val>, exp0: Exp<Met, Rul, Val>
    ): { zip: Zip<Met, Rul, Val>, exp: Exp<Met, Rul, Val> } | undefined {
    const exp1 = zip.kidsLeft.get(0)
    if (exp1 === undefined) return undefined
    return { zip: { ...zip, kidsLeft: zip.kidsLeft.shift(), kidsRight: zip.kidsRight.unshift(exp0) }, exp: exp1 }
}

export function unzipExp<Met, Rul, Val>
    (gram: Grammar<Met, Rul, Val>, zip: Zip<Met, Rul, Val>, exp: Exp<Met, Rul, Val>
    ): Exp<Met, Rul, Val> {
    const kidMets = gram.kids(zip.rul)
    // verify that exp can fit into zip
    // assert(kidMets[zip.kidsLeft.size] === exp.met)
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
    gram: Grammar<Met, Rul, Val>, csr: Cursor<Met, Rul, Val>
): Exp<Met, Rul, Val> {
    const zip = csr.zips.get(0)
    if (zip === undefined) return csr.exp
    return unzipsExp(gram, { zips: csr.zips.shift(), exp: unzipExp(gram, zip, csr.exp) })
}

// move to bot-left-most valid cusror position
export function moveBotLeft<Met, Rul, Val>(lang: Language<Met, Rul, Val>, csr0: Cursor<Met, Rul, Val>): Cursor<Met, Rul, Val> | undefined {
    // try moving down
    const csr1 = moveNextDown(lang, csr0)
    if (csr1 !== undefined) {
        // if we can move down, then recurse
        const csr2 = moveBotLeft(lang, csr1)
        // if recurse failed, then try to return here
        if (csr2 === undefined) {
            // if here isn't a valid cursor, then fail
            if (!lang.isValidCursor(csr1)) return undefined
            // return here
            return csr1
        }
        // return recursive result
        return csr2
    }
    // if we can't move down then try to return here
    if (csr1 === undefined) {
        // if here isn't a valid cursor, then fail
        if (!lang.isValidCursor(csr0)) return undefined
        // return here
        return csr0
    }
}

// move to bot-right-most valid cusror position
export function moveBotRight<Met, Rul, Val>(lang: Language<Met, Rul, Val>, csr0: Cursor<Met, Rul, Val>): Cursor<Met, Rul, Val> | undefined {
    throw new Error("TODO");
}

// move to next valid cursor position
export function moveNext<Met, Rul, Val>(lang: Language<Met, Rul, Val>, csr0: Cursor<Met, Rul, Val>): Cursor<Met, Rul, Val> | undefined {
    // try to move next down
    const csr1 = moveNextDown(lang, csr0)
    // if that succeeds, then return it
    if (csr1 !== undefined) return csr1

    // otherwise, we need to step up until we can step right
    let zips0 = csr0.zips
    let exp0 = csr0.exp
    for (let i = 0; i < zips0.size; i++) {
        // zip up
        const zip = zips0.get(i) as Zip<Met, Rul, Val>
        zips0 = zips0.shift()
        exp0 = unzipExp(lang.grammar, zip, exp0)
        // try to zip right
        const res0 = zipRight(lang.grammar, zip, exp0)
        if (res0 === undefined) continue
        // move to bot-left
        const res1 = moveBotLeft(lang, { zips: zips0.unshift(res0.zip), exp: res0.exp })
        if (res1 === undefined) continue
        return res1
    }
    return undefined
}

export function moveNextDown<Met, Rul, Val>(lang: Language<Met, Rul, Val>, csr0: Cursor<Met, Rul, Val>): Cursor<Met, Rul, Val> | undefined {
    const res = zipExp(lang.grammar, csr0.exp, 0)
    if (res === undefined) return undefined
    const csr1 = { zips: csr0.zips.unshift(res.zip), exp: res.exp }
    // if moving down once yields an invalid cursor, then move down again
    if (!lang.isValidCursor(csr1)) return moveNextDown(lang, csr1)
    return csr1
}

// move to previous valid cursor position
export function movePrev<Met, Rul, Val>(lang: Language<Met, Rul, Val>, csr0: Cursor<Met, Rul, Val>): Cursor<Met, Rul, Val> | undefined {

    let zips0 = csr0.zips
    let exp0 = csr0.exp

    function goUp(zip: Zip<Met, Rul, Val>) {
        zips0 = zips0.shift()
        exp0 = unzipExp(lang.grammar, zip, exp0)
    }

    for (let i = 0; i < zips0.size; i++) {
        // try to move left
        const zip = csr0.zips.get(i) as Zip<Met, Rul, Val>
        const res0 = zipLeft(lang.grammar, zip, exp0)
        if (res0 === undefined) { goUp(zip); continue }
        const csr1 = { zips: csr0.zips.unshift(res0.zip), exp: res0.exp }
        // move to bot-right
        const csr2 = moveBotRight(lang, csr1)
        if (csr2 === undefined) { goUp(zip); continue }
        return csr2
    }

    // stop at top (zips should be empty)
    const csr3 = { zips: zips0, exp: exp0 }
    if (!lang.isValidCursor(csr3)) return undefined
    return csr3
}
