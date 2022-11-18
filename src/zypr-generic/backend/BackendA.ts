import { List, Record, RecordOf } from "immutable";
import { EndoPart, EndoReadPart } from "../../Endo";
import * as Backend from "../Backend";
import { eqZip, Grammar, makeHole, makeZipTemplate, makeZipTemplates, moveCursor, moveSelect, unzipsExp, verifyExp, verifyZip, zipExp } from "../Language";
import { Pre, Exp, Zip, Met, Rul, Val, AppVal, grammar } from "../language/LanguageAlpha";
import { Node, ExpNode } from "../Node";

type Env = RecordOf<{
    st: Backend.State<Met, Rul, Val, Dat>,
    indentationLevel: number,
    zips: List<Zip>,
}>

export type Dat = {
    pre: Pre,
    indent: number | undefined,
    isParenthesized: boolean,
}

export default function backend(): Backend.Backend<Met, Rul, Val, Dat> {

    function isValidSelect(select: Backend.Select<Met, Rul, Val>): boolean {
        // TODO: modify when there are lambdas with ids
        return true
    }

    const makeInitEnv = (st: Backend.State<Met, Rul, Val, Dat>): Env => Record({
        st,
        indentationLevel: 0,
        zips: List([])
    })()

    const isArg = (childing: Backend.Childing<Zip>) =>
        childing !== undefined &&
        childing.rul === 'app' &&
        childing.kidsLeft.size === 1

    function nextEnv(
        childing: Backend.Childing<Zip>,
        env: Env
    ): Env {
        if (childing === undefined) return env
        const env_ = env.update('zips', zips => zips.unshift(childing))
        switch (childing.rul) {
            case 'var': return env_
            case 'app': return env_.update('indentationLevel', (i) => isArg(childing) ? i + 1 : i)
            case 'hol': return env_
        }
    }

    function escapeSelect(
        select: Backend.Select<Met, Rul, Val>
    ): Backend.Cursor<Met, Rul, Val> {
        switch (select.orient) {
            case 'top': return {
                zips: select.zipsTop,
                exp: unzipsExp(grammar, select.zipsBot.reverse(), select.exp)
            }
            case 'bot': return {
                zips: select.zipsBot.concat(select.zipsTop),
                exp: select.exp
            }
        }
    }

    function enterSelect(
        cursor: Backend.Cursor<Met, Rul, Val>,
        orient: Backend.Orient
    ): Backend.Select<Met, Rul, Val> {
        return {
            zipsTop: cursor.zips,
            zipsBot: List([]),
            exp: cursor.exp,
            orient
        }
    }

    const formatPre = (
        exp: Exp,
        pre: Pre,
        env: Env,
        kids: ExpNode<Met, Rul, Val, Dat>[],
        childing: Backend.Childing<Zip>
    ): Node<Met, Rul, Val, Dat> => ({
        case: 'exp',
        dat: {
            pre,
            isParenthesized:
                (isArg(childing) && pre.rul === 'app') ||
                (childing?.rul !== 'app' && pre.rul === 'app'),
            // indent: isArg(childing) ? env.indentationLevel : undefined, // always indents
            indent: isArg(childing) && pre.rul === 'app' && pre.val ? env.indentationLevel : undefined
        },
        kids: kids.map(kid => kid.node),
        getCursor: () => ({ zips: env.zips, exp }),
        getSelect: () => {
            const cursor1: Backend.Cursor<Met, Rul, Val> = (() => {
                switch (env.st.mode.case) {
                    case 'cursor': return env.st.mode.cursor
                    case 'select': return escapeSelect(env.st.mode.select)
                }
            })()
            const cursor2: Backend.Cursor<Met, Rul, Val> = { zips: env.zips, exp }
            // find the selection between zips, if there is one
            return getSelectBetweenCursor(cursor1, cursor2)
        }
    })

    const defined = <A>(a: A | undefined): A => a as A

    const formatExp = (exp: Exp, childing: Backend.Childing<Zip>) => (env: Env): ExpNode<Met, Rul, Val, Dat> => {
        switch (exp.rul) {
            case 'var': return {
                exp,
                node: formatPre(exp, exp, env, [], childing)
            }
            case 'app': {
                const kids = exp.kids.map((kid, i) =>
                    formatExp(kid, defined(zipExp(grammar, exp, i)).zip)
                        (nextEnv(defined(zipExp(grammar, exp, i)).zip, env)))
                    .toArray()
                return {
                    exp,
                    node: formatPre(exp, exp, env, kids, childing)
                }
            }
            case 'hol': return {
                exp,
                node: formatPre(exp, exp, env, [], childing)
            }
        }
    }

    // formatZip: (zips: ListZip<Met,Rul,Val>, childing: Childing<Zip<Met,Rul,Val>>) => (kid: (env: Env<Exp<Met,Rul,Val>, Zip<Met,Rul,Val>, Dat<Met,Rul,Val>>) => ExpNode<Exp,Zip<Met,Rul,Val>,Dat<Met,Rul,Val>>) => (env: Env<Exp<Met,Rul,Val>, Zip<Met,Rul,Val>, Dat<Met,Rul,Val>>) => ExpNode<Exp,Zip<Met,Rul,Val>,Dat<Met,Rul,Val>>,
    const formatZip =
        (zips: List<Zip>, childing: Backend.Childing<Zip>) =>
            (node: ((env: Env) => ExpNode<Met, Rul, Val, Dat>)): (env: Env) => ExpNode<Met, Rul, Val, Dat> => {
                const zip = zips.get(0)
                if (zip === undefined) {
                    return node
                } else {
                    return formatZip(zips.shift(), childing)((env): ExpNode<Met, Rul, Val, Dat> => {
                        const kid = node(nextEnv(zip, env))
                        const exp = unzipsExp(grammar, List([zip]), kid.exp)

                        // is reversed
                        const kidsLeft: ExpNode<Met, Rul, Val, Dat>[] =
                            zip.kidsLeft.reverse().map((kid, i) =>
                                formatExp(kid, defined(zipExp(grammar, exp, i)).zip)
                                    (nextEnv(defined(zipExp(grammar, exp, i)).zip, env))
                            ).toArray()

                        const kidsRight: ExpNode<Met, Rul, Val, Dat>[] =
                            zip.kidsRight.map((kid, i) =>
                                formatExp(kid, defined(zipExp(grammar, exp, i + zip.kidsLeft.size + 1)).zip)
                                    (nextEnv(defined(zipExp(grammar, exp, i + zip.kidsLeft.size + 1)).zip, env))
                            ).toArray()

                        const kids: ExpNode<Met, Rul, Val, Dat>[] =
                            ([] as ExpNode<Met, Rul, Val, Dat>[]).concat(
                                kidsLeft,
                                [kid],
                                kidsRight
                            )

                        return {
                            exp: exp,
                            node: formatPre(exp, zip, env, kids, zips.get(1) ?? childing)
                        }
                    })
                }
            }

    const interpretQueryString = Backend.buildInterpretQueryString(grammar,
        (met, str): { rul: Rul, val: Val } | undefined => {
            switch (met) {
                case 'exp': {
                    if (str === " ") return { rul: 'app', val: { indentedArg: false } }
                    else return { rul: 'var', val: { label: str } }
                }
            }
        }
    )

    // function interpretQueryString(
    //     st: Backend.State<Met,Rul,Val,Dat>,
    //     str: string
    // ): Backend.Action<Met, Rul, Val>[] {
    //     if (str === "") return []
    //     else if (str === " ") {
    //         const acts: Backend.Action<Met, Rul, Val>[] =
    //             makeZipTemplates(grammar, 'exp', 'app').map((zip) => ({
    //                 case: 'insert',
    //                 zips: List([zip])
    //             }))
    //         return acts
    //     } else {
    //         const acts: Backend.Action<Met, Rul, Val>[] = [
    //             {
    //                 case: 'replace',
    //                 exp: verifyExp(grammar, {
    //                     met: 'exp',
    //                     rul: 'var',
    //                     val: { label: str },
    //                     kids: List([])
    //                 })
    //             }
    //         ]
    //         return acts
    //     }
    // }

    function interpretKeyboardCommandEvent(st: Backend.State<Met, Rul, Val, Dat>, event: KeyboardEvent): Backend.Action<Met, Rul, Val> | undefined {
        if (event.ctrlKey || event.metaKey) {
            if (event.key === 'c') return { case: 'copy' }
            else if (event.key === 'x') return { case: 'cut' }
            else if (event.key === 'v') return { case: 'paste' }
            else if (event.key === 'Z') return { case: 'redo' }
            else if (event.key === 'z') return { case: 'undo' }
        }
        if (event.key === 'Tab') {
            switch (st.mode.case) {
                case 'cursor': {
                    const exp: Exp | undefined = (() => {
                        switch (st.mode.cursor.exp.rul) {
                            case 'app': {
                                const val = st.mode.cursor.exp.val as AppVal
                                return { ...st.mode.cursor.exp, dat: { ...val, indentedArg: !val.indentedArg } }
                            }
                            default: return undefined
                        }
                    })()
                    if (exp !== undefined) return { case: 'replace', exp: st.mode.cursor.exp }
                    else return undefined
                }
                case 'select': {
                    // TODO: indent everything in selection
                    return undefined
                }
            }
        }

        return undefined
    }

    const initExp: Exp = makeHole(grammar, 'exp')

    return Backend.buildBackend<Met, Rul, Val, Dat, Env>(
        {
            grammar: grammar,
            isValidSelect,
            makeInitEnv,
            formatExp,
            formatZip,
            interpretQueryString,
            interpretKeyboardCommandEvent,
            initExp
        })
}

// TODO: shouldn't it orient the other way sometimes??
export function getSelectBetweenCursor(
    cursorStart: Backend.Cursor<Met, Rul, Val>,
    cursorEnd: Backend.Cursor<Met, Rul, Val>
): Backend.Select<Met, Rul, Val> | undefined {
    function go(zipsStart: List<Zip>, zipsEnd: List<Zip>, up: List<Zip>):
        Backend.Select<Met, Rul, Val> | undefined {
        const zipStart = zipsStart.get(0)
        const zipEnd = zipsEnd.get(0)
        if (zipStart === undefined && zipEnd === undefined) {
            return undefined // same zips
        } else if (zipStart === undefined) {
            // zipsStart is a subzipper of (i.e. is above) zipsEnd
            return { zipsTop: up, zipsBot: zipsEnd, exp: cursorEnd.exp, orient: 'top' }
        } else if (zipEnd === undefined) {
            // zipsEnd is a subzipper of (i.e. is above) zipsStart
            return { zipsTop: up, zipsBot: zipsStart.reverse(), exp: cursorStart.exp, orient: 'bot' }
        } else if (eqZip(zipStart, zipEnd)) {
            return go(zipsStart.shift(), zipsEnd.shift(), up.unshift(zipStart))
        } else {
            return undefined // zips branch in different directions
        }
    }
    return go(cursorStart.zips.reverse(), cursorEnd.zips.reverse(), List([]))
}
