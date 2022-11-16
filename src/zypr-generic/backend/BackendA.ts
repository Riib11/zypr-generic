import { List, Record, RecordOf } from "immutable";
import { EndoPart } from "../../Endo";
import * as Backend from "../Backend";
import { Dat, Exp, fixSelect, mkHol, moveCursor, moveSelect, PreExp, unzipExp, Zip, zipExp, zipsUp } from "../language/Language1";
import { Node, ExpNode } from "../Node";

type Env = RecordOf<{
    indentationLevel: number
}>

export default function backend(): Backend.Backend<Exp, Zip, Dat> {

    const initEnv: Env = Record({
        indentationLevel: 0
    })()

    const isArg = (childing: Backend.Childing<Zip>) =>
        childing !== undefined &&
        childing.case === 'app' &&
        childing.kidsLeft.size === 1

    function nextEnv(
        preExp: PreExp,
        i: number,
        childing: Backend.Childing<Zip>,
        env: Env
    ): Env {
        if (childing === undefined) return env
        switch (childing.case) {
            case 'var': return env
            case 'app': return isArg(childing) ? env.update('indentationLevel', (i) => i + 1) : env
            case 'hol': return env
        }
    }

    const formatPreExp = (preExp: PreExp, env: Env, kids: ExpNode<Exp, Dat>[], childing: Backend.Childing<Zip>): Node<Dat> => ({
        case: 'exp',
        dat: {
            preExp,
            isParenthesized: isArg(childing) && preExp.case === 'app',
            isApp: preExp.case === 'app',
            indent: isArg(childing) ? env.indentationLevel : undefined
        },
        kids: kids.map(kid => kid.node)
    })

    const formatExp = (exp: Exp, childing: Backend.Childing<Zip>) => (env: Env): ExpNode<Exp, Dat> => {
        switch (exp.case) {
            case 'var': return {
                exp,
                node: formatPreExp(exp, env, [], childing)
            }
            case 'app': return {
                exp,
                node: formatPreExp(
                    exp,
                    env,
                    exp.kids.map((kid, i) => formatExp(kid, zipExp(exp, i))(nextEnv(exp, i, zipExp(exp, i), env))),
                    childing)
            }
            case 'hol': return {
                exp,
                node: formatPreExp(exp, env, [], childing)
            }
        }
    }

    // formatZip: (zips: List<Zip>, childing: Childing<Zip>) => (kid: (env: Env) => ExpNode<Exp, Dat>) => (env: Env) => ExpNode<Exp, Dat>,
    const formatZip =
        (zips: List<Zip>, childing: Backend.Childing<Zip>) =>
            (node: ((env: Env) => ExpNode<Exp, Dat>)): (env: Env) => ExpNode<Exp, Dat> => {
                const zip = zips.get(0)
                if (zip === undefined) {
                    return node
                } else {
                    return formatZip(zips.shift(), childing)((env): ExpNode<Exp, Dat> => {
                        const kid = node(nextEnv(zip, zip.kidsLeft.size + 1, zip, env))
                        const exp = unzipExp(zip, kid.exp)

                        const kidsLeft: ExpNode<Exp, Dat>[] = zip.kidsLeft.reverse().map((kid, i) =>
                            formatExp(kid, zipExp(exp, i))(nextEnv(zip, i, zipExp(exp, i), env))).toArray()
                        const kidsRight: ExpNode<Exp, Dat>[] = zip.kidsRight.map((kid, i) =>
                            formatExp(kid, zipExp(exp, i + zip.kidsLeft.size + 1))(nextEnv(zip, i + zip.kidsLeft.size + 1, zipExp(exp, i + zip.kidsLeft.size + 1), env))).toArray()

                        const kids: ExpNode<Exp, Dat>[] = ([] as ExpNode<Exp, Dat>[]).concat(kidsLeft, [kid], kidsRight)
                        return {
                            exp: exp,
                            node: formatPreExp(zip, env, kids, zips.get(1) ?? childing)
                        }
                    })
                }
            }

    function interpQueryString(
        st: Backend.State<Exp, Zip, Dat>,
        str: string
    ): Backend.Action<Exp, Zip>[] {
        if (str === "") return []
        else if (str === " ") {
            const acts: Backend.Action<Exp, Zip>[] = [
                {
                    case: 'insert',
                    zips: List<Zip>([{
                        case: 'app',
                        dat: { 'indentedArg': false },
                        kidsLeft: List([]),
                        kidsRight: List([{ case: 'hol', dat: {}, kids: [] }])
                    }])
                },
                {
                    case: 'insert',
                    zips: List<Zip>([{
                        case: 'app',
                        dat: { 'indentedArg': false },
                        kidsLeft: List([{ case: 'hol', dat: {}, kids: [] }]),
                        kidsRight: List([])
                    }])
                }
            ]
            return acts
        } else {
            const acts: Backend.Action<Exp, Zip>[] = [
                {
                    case: 'replace',
                    exp: { case: 'var', dat: { label: str }, kids: [] }
                }
            ]
            return acts
        }

    }

    function interpKeyboardCommandEvent(st: Backend.State<Exp, Zip, Dat>, event: KeyboardEvent): Backend.Action<Exp, Zip> | undefined {
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
                        switch (st.mode.cursor.exp.case) {
                            case 'app': {
                                const dat = st.mode.cursor.exp.dat
                                return { ...st.mode.cursor.exp, dat: { ...dat, indentedArg: !dat.indentedArg } }
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
        act: Backend.Action<Exp, Zip>
    ): EndoPart<Backend.State<Exp, Zip, Dat>> {
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
                return Backend.updateMode((mode): Backend.Mode<Exp, Zip> => {
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
            case 'move_cursor': {
                return Backend.updateMode((mode): Backend.Mode<Exp, Zip> | undefined => {
                    switch (mode.case) {
                        case 'cursor': {
                            const cursor = moveCursor(act.dir, mode.cursor)
                            if (cursor === undefined) return undefined
                            return { case: 'cursor', cursor: cursor }
                        }
                        case 'select': {
                            const cursor = moveCursor(act.dir, escapeSelect(mode.select))
                            if (cursor === undefined) return undefined
                            return { case: 'cursor', cursor }
                        }
                    }
                })
            }
            case 'move_select': {
                return Backend.updateMode((mode): Backend.Mode<Exp, Zip> | undefined => {
                    switch (mode.case) {
                        case 'cursor': {
                            const orient: Backend.Orient = act.dir === 'up' ? 'top' : 'bot'
                            const select = moveSelect(act.dir, enterSelect(mode.cursor, orient))
                            if (select === undefined) return undefined
                            const mode_ = fixSelect(select)
                            return mode_
                        }
                        case 'select': {
                            const select = moveSelect(act.dir, mode.select)
                            if (select === undefined) return undefined
                            const mode_ = fixSelect(select)
                            return mode_
                        }
                    }
                })
            }
            case 'delete': {
                return Backend.updateMode((mode): Backend.Mode<Exp, Zip> | undefined => {
                    switch (mode.case) {
                        case 'cursor': {
                            return {
                                case: 'cursor',
                                cursor: {
                                    zips: mode.cursor.zips,
                                    exp: mkHol()
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
            case 'escape': {
                return Backend.updateMode((mode): Backend.Mode<Exp, Zip> | undefined => {
                    switch (mode.case) {
                        case 'cursor': return undefined
                        case 'select': return {
                            case: 'cursor',
                            cursor: escapeSelect(mode.select)
                        }
                    }
                })
            }
            case 'cut': return Backend.cut(mkHol())
            case 'copy': return Backend.copy()
            case 'paste': return Backend.paste()
            case 'undo': return Backend.undo()
            case 'redo': return Backend.redo()
            default: {
                console.log("action case not implemented by backend:", act.case)
                return (st) => st // TODO
            }
        }
    }

    const initExp: Exp = mkHol()

    return Backend.buildBackend<Exp, Zip, Dat, Env>(
        { zipExp, unzipExp, initEnv, formatExp, formatZip, interpQueryString, interpKeyboardCommandEvent, handleAction, initExp })
}

export function escapeSelect(select: Backend.Select<Exp, Zip>): Backend.Cursor<Exp, Zip> {
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

export function enterSelect(cursor: Backend.Cursor<Exp, Zip>, orient: Backend.Orient): Backend.Select<Exp, Zip> {
    return {
        zipsTop: cursor.zips,
        zipsBot: List([]),
        exp: cursor.exp,
        orient
    }
}