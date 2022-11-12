import { List, Record, RecordOf } from "immutable";
import { EndoPart } from "../../Endo";
import * as Backend from "../Backend";
import { Dat, Exp, move, PreExp, Zip } from "../language/Language1";
import { Node } from "../Node";

type Env = RecordOf<{
    indented: boolean
}>

export default function backend(): Backend.Backend<Exp, Zip, Dat> {

    const initEnv: Env = Record({
        indented: false
    })()

    function nextEnv(
        preExp: PreExp,
        i: number,
        env: Env
    ): Env {
        switch (preExp.case) {
            case 'var': return env
            case 'app': {
                if (i == 1) return env.set('indented', true)
                else return env
            }
            case 'hol': return env
        }
    }

    const formatPreExp = (preExp: PreExp, env: Env, kids: Node<Dat>[]): Node<Dat> => ({
        case: 'exp',
        dat: {
            preExp,
            indented: env.indented
        },
        kids
    })

    const formatExp = (exp: Exp) => (env: Env): Node<Dat> => {
        switch (exp.case) {
            case 'var': return formatPreExp(exp, env, [])
            case 'app': return formatPreExp(
                exp,
                env,
                [exp.kids[0], exp.kids[1]].map((kid, i) =>
                    formatExp(kid)(nextEnv(exp, i, env))))
            case 'hol': return formatPreExp(exp, env, [])
        }
    }

    const formatZip = (zips: List<Zip>) => (node: ((env: Env) => Node<Dat>)): (env: Env) => Node<Dat> => {
        const zip = zips.get(0)
        if (zip === undefined) {
            return node
        } else {
            return formatZip(zips.shift())((env) => {
                const kidsLeft = zip.kidsLeft.reverse().map((kid, i) => formatExp(kid)(nextEnv(zip, i, env))).toArray()
                const kidCenter = node(nextEnv(zip, zip.kidsLeft.size + 1, env))
                const kidsRight = zip.kidsRight.map((kid, i) => formatExp(kid)(nextEnv(zip, i, env))).toArray()
                const kids: Node<Dat>[] = ([] as Node<Dat>[]).concat(kidsLeft, [kidCenter], kidsRight)
                return formatPreExp(zip, env, kids)
            })
        }
    }

    function interpQuery(st: Backend.State<Exp, Zip, Dat>,
        str: string
    ): Backend.Action<Exp, Zip>[] {
        if (str === " ") {
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
                            select: {
                                zipsTop: mode.select.zipsTop,
                                zipsBot: Backend.toZipBot(mode.select, act.zips),
                                orient: mode.select.orient,
                                exp: mode.select.exp,
                            }
                        }
                    }
                })
            }
            case 'move': {
                return Backend.updateMode((mode): Backend.Mode<Exp, Zip> | undefined => {
                    switch (mode.case) {
                        case 'cursor': {
                            const res = move(act.dir, mode.cursor.zips, mode.cursor.exp)
                            if (res === undefined) return undefined
                            return { case: 'cursor', cursor: { zips: res.zips, exp: res.exp } }
                        }
                    }
                })
            }
            default: return (st) => st // TODO
        }
    }

    const initExp: Exp = { case: 'var', dat: { label: "x" }, kids: [] }

    return Backend.buildBackend<Exp, Zip, Dat, Env>(
        initEnv,
        formatExp,
        formatZip,
        interpQuery,
        handleAction,
        initExp
    )
}