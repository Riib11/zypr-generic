import { List, Record, RecordOf } from "immutable";
import { EndoPart, EndoReadPart } from "../../Endo";
import * as Backend from "../Backend";
import { Grammar, makeHole, makeZipTemplate, makeZipTemplates, moveCursor, moveSelect, unzipsExp, verifyExp, verifyZip, zipExp } from "../Language";
import { Pre, Exp, Zip, Met, Rul, Val, AppVal } from "../language/LanguageAlpha";
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

export default function backend(
    gram: Grammar<Met, Rul, Val>
): Backend.Backend<Met, Rul, Val, Dat> {

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

    const formatExp = (exp: Exp, childing: Backend.Childing<Zip>) => (env: Env): ExpNode<Met, Rul, Val, Dat> => {
        switch (exp.rul) {
            case 'var': return {
                exp,
                node: formatPre(exp, exp, env, [], childing)
            }
            case 'app': {
                const kids = exp.kids.map((kid, i) =>
                    formatExp(kid, zipExp(gram, exp, i).zip)
                        (nextEnv(zipExp(gram, exp, i).zip, env)))
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
                        const exp = unzipsExp(gram, List([zip]), kid.exp)

                        // is reversed
                        const kidsLeft: ExpNode<Met, Rul, Val, Dat>[] = zip.kidsLeft.reverse().map((kid, i) =>
                            formatExp(kid, zipExp(gram, exp, i).zip)(nextEnv(zipExp(gram, exp, i).zip, env))).toArray()
                        const kidsRight: ExpNode<Met, Rul, Val, Dat>[] = zip.kidsRight.map((kid, i) =>
                            formatExp(kid, zipExp(gram, exp, i + zip.kidsLeft.size + 1).zip)(nextEnv(zipExp(gram, exp, i + zip.kidsLeft.size + 1).zip, env))).toArray()

                        const kids: ExpNode<Met, Rul, Val, Dat>[] = ([] as ExpNode<Met, Rul, Val, Dat>[]).concat(kidsLeft, [kid], kidsRight)
                        return {
                            exp: exp,
                            node: formatPre(exp, zip, env, kids, zips.get(1) ?? childing)
                        }
                    })
                }
            }

    const interpQueryString = Backend.buildInterpQueryString(gram,
        (met, str) => {
            throw new Error("TODO");
        }
    )

    // function interpQueryString(
    //     st: Backend.State<Met,Rul,Val,Dat>,
    //     str: string
    // ): Backend.Action<Met, Rul, Val>[] {
    //     if (str === "") return []
    //     else if (str === " ") {
    //         const acts: Backend.Action<Met, Rul, Val>[] =
    //             makeZipTemplates(gram, 'exp', 'app').map((zip) => ({
    //                 case: 'insert',
    //                 zips: List([zip])
    //             }))
    //         return acts
    //     } else {
    //         const acts: Backend.Action<Met, Rul, Val>[] = [
    //             {
    //                 case: 'replace',
    //                 exp: verifyExp(gram, {
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

    function interpKeyboardCommandEvent(st: Backend.State<Met, Rul, Val, Dat>, event: KeyboardEvent): Backend.Action<Met, Rul, Val> | undefined {
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

    function handleAction(
        act: Backend.Action<Met, Rul, Val>
    ): EndoReadPart<Backend.Props<Met, Rul, Val, Dat>, Backend.State<Met, Rul, Val, Dat>> {
        switch (act.case) {
            case 'replace': {
                return Backend.updateMode(mode => {
                    switch (mode.case) {
                        case 'cursor': return {
                            case: 'cursor',
                            cursor: {
                                zips: mode.cursor.zips,
                                exp: act.exp
                            }
                        }
                        case 'select': return undefined
                    }
                })
            }
            case 'insert': {
                return Backend.updateMode((mode): Backend.Mode<Met, Rul, Val> => {
                    switch (mode.case) {
                        case 'cursor': return {
                            case: 'cursor',
                            cursor: {
                                zips: act.zips.concat(mode.cursor.zips),
                                exp: mode.cursor.exp // wrapZipExp(act.zips, mode.cursor.exp)
                            }
                        }
                        case 'select': return {
                            case: 'select',
                            select: Backend.setZipsBot(mode.select, act.zips)
                        }
                    }
                })
            }
            case 'move_cursor': return Backend.updateMode((mode) => moveCursor(gram, act.dir, mode))
            case 'move_select': return Backend.updateMode((mode) => moveSelect(gram, act.dir, mode))
            case 'delete': {
                return Backend.updateMode((mode): Backend.Mode<Met, Rul, Val> | undefined => {
                    switch (mode.case) {
                        case 'cursor': {
                            return {
                                case: 'cursor',
                                cursor: {
                                    zips: mode.cursor.zips,
                                    exp: makeHole(gram, 'exp')
                                }
                            }
                        }
                        case 'select': {
                            return {
                                case: 'cursor',
                                cursor: {
                                    zips: mode.select.zipsTop,
                                    exp: mode.select.exp
                                }
                            }
                        }
                    }
                })
            }
            case 'escape': return Backend.updateMode((mode): Backend.Mode<Met, Rul, Val> | undefined => {
                switch (mode.case) {
                    case 'cursor': return undefined
                    case 'select': return {
                        case: 'cursor',
                        cursor: escapeSelect(mode.select)
                    }
                }
            })
            case 'cut': return Backend.cut()
            case 'copy': return Backend.copy()
            case 'paste': return Backend.paste()
            case 'undo': return Backend.undo()
            case 'redo': return Backend.redo()
            case 'set_cursor': {
                return Backend.updateMode((mode): Backend.Mode<Met, Rul, Val> => ({
                    case: 'cursor',
                    cursor: act.cursor
                }))
            }
            case 'set_select': {
                return Backend.updateMode((mode): Backend.Mode<Met, Rul, Val> => ({
                    case: 'select',
                    select: act.select
                }))
            }
            // default: {
            //     console.log("action case not implemented by backend:", act.case)
            //     return (st) => st // TODO
            // }
        }
    }

    const initExp: Exp = makeHole(gram, 'exp')

    return Backend.buildBackend<Exp, Zip, Dat, Env>(
        {
            grammar: gram,
            isValidSelect,
            makeInitEnv<Met, Rul, Val, Dat>,
            formatExp,
            formatZip,
            interpQueryString,
            interpKeyboardCommandEvent,
            handleAction,
            initExp
        })
}

export function escapeSelect(select: Backend.Select<Met, Rul, Val>): Backend.Cursor<Met, Rul, Val> {
    switch (select.orient) {
        case 'top': return {
            zips: select.zipsTop,
            exp: zipsUp(select.zipsBot.reverse(), select.exp)
        }
        case 'bot': return {
            zips: select.zipsBot.concat(select.zipsTop),
            exp: select.exp
        }
    }
}

export function enterSelect(cursor: Backend.Cursor<Met, Rul, Val>, orient: Backend.Orient): Backend.Select<Met, Rul, Val> {
    return {
        zipsTop: cursor.zips,
        zipsBot: List([]),
        exp: cursor.exp,
        orient
    }
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
        } else if (
            zipStart.case === zipEnd.case &&
            zipStart.dat === zipEnd.dat &&
            zipStart.kidsLeft.size === zipEnd.kidsLeft.size &&
            zipStart.kidsRight.size === zipEnd.kidsRight.size
        ) {
            return go(zipsStart.shift(), zipsEnd.shift(), up.unshift(zipStart))
        } else {
            return undefined // zips branch in different directions
        }
    }
    return go(cursorStart.zips.reverse(), cursorEnd.zips.reverse(), List([]))
}