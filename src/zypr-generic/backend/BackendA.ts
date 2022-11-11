import { List, Record, RecordOf } from "immutable";
import { EndoPart } from "../../Endo";
import * as Backend from "../Backend";
import { Dat, Exp, PreExp, Step, Zip } from "../language/Language1";
import { buildExpNode, Node } from "../Node";

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
        }
    }

    const formatPreExp = (preExp: PreExp, env: Env, kids: Node<Dat>[]): Node<Dat> => {
        return buildExpNode(
            {
                preExp,
                indented: env.indented
            },
            kids
        )
    }

    const formatExp = (exp: Exp) => (env: Env): Node<Dat> => {
        switch (exp.case) {
            case 'var': return formatPreExp(exp, env, [])
            case 'app':
                return formatPreExp(
                    exp,
                    env,
                    [exp.apl, exp.arg].map((kid, i) =>
                        formatExp(kid)(nextEnv(exp, i, env))))
        }
    }

    const formatZip = (zip: Zip) => (node: ((env: Env) => Node<Dat>)): (env: Env) => Node<Dat> => {
        const step = zip.get(0)
        if (step === undefined) {
            return node
        } else {
            return formatZip(zip.shift())((env) =>
                formatPreExp(step, env,
                    (step.kidsLeft.reverse().map((kid, i) => formatExp(kid)(nextEnv(step, i, env)))
                        .concat(List([node(nextEnv(step, step.kidsLeft.size + 1, env))]))
                        .concat(step.kidsLeft.map((kid, i) => formatExp(kid)(nextEnv(step, i, env))))
                    ).toArray()
                )
            )
        }
    }

    function interpQuery(st: Backend.State<Exp, Zip, Dat>,
        str: string
    ): Backend.Action<Exp, Zip>[] {
        return [
            { case: 'replace', exp: { case: 'var', dat: { label: str } } }
        ]
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
                                zip: mode.cursor.zip,
                                exp: act.exp
                            }
                        }
                        case 'select': return undefined
                    }
                })
            }
            case 'insert': {
                return Backend.updateMode(mode => {
                    switch (mode.case) {
                        case 'cursor': return {
                            case: 'cursor',
                            cursor: {
                                zip: mode.cursor.zip.concat(act.zip), // TODO: correct order of concat?
                                exp: mode.cursor.exp
                            }
                        }
                        case 'select': return {
                            case: 'select',
                            select: {
                                zip_top: mode.select.zip_top,
                                zip_bot: act.zip, // TODO: fix via orient
                                orient: mode.select.orient,
                                exp: mode.select.exp,
                            }
                        }
                    }
                })
            }
            default: return (st) => st // TODO
        }
    }

    const initExp: Exp = {
        case: 'var',
        dat: { label: "x" }
    }

    return Backend.buildBackend<Exp, Step, Dat, Env>(
        initEnv,
        formatExp,
        formatZip,
        interpQuery,
        handleAction,
        initExp
    )
}